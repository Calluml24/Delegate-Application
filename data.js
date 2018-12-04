//Main functionality for various pages in the application
//////////////////////////////////////////////////////////////////////////////////////////////////////////
//PM The following section sets the connection to the local database
        
var MultipleUser = ""; // Used to read the login ID so database gets data for individual user
// PM - Local database global variables - This creates a database and gives it a name with a few MySQL parameters such as size
var db;
var shortName = 'SqlDB';
var version = '1.0';
var displayName = 'SqlDB';
var maxSize = 65535;
            
//These are error handling functions that have been comented out for success - post-testing
function errorHandler(transaction, error) {
    console.log('Error: ' + error.message + ' code: ' + error.code);
}

//only needed when during testing
function successCallBack() {
    //alert("DEBUGGING: success"); 
}
//PM - More testing feedback - If the browser does not support databases (everything except Phonegap, Chrome and Opera) then this message is displayed
function nullHandler(){
    if (!window.openDatabase){ 
    alert('Databases are not supported in this browser.');
    return;
    } 
};
//PM - Connect to database using the variables above. This can be repeated if we are using multple pages and will log on to the same database created before (it does not overwrite the database)

db = openDatabase(shortName, version, displayName,maxSize); 
//////////////////////////////////////////////////////////////////////////////////////////////////////////
var now = new Date().toISOString();
now = now.substring(0,now.length-1);

var dateControl = document.querySelector('input[type="datetime-local"]');
//dateControl.value = now;
//console.log(now.format("dd/MM/yyyy hh:mm TT"));

//This object holds login details for the user
loginObj = new Object();
loginObj.base_url = "https://keele.bookmein2.com/api/api.php?";
attendees = new Object();

//This is a utility function to select certain keys from loginObj for URL calls
var pick = function (obj, attrs) {
    return attrs.reduce(function (result, key) {
    result[key] = obj[key];
    return result;
    }, {});
};

//LOgin - page2
//Poll API and return API key needed for subsequent calls
$("form#login_form").submit(function(evt){
    evt.preventDefault(); //prevents the default action
    //extract the data from the form

    loginObj.action = "login";
    loginObj.email = $('#login_form').find('input[name="email"]').val();
    loginObj.eventref = $('#login_form').find('input[name="event_id"]').val();
    loginObj.attendeeref = $('#login_form').find('input[name="attendee_id"]').val();
    loginObj.agreedterms = $('#login_form').find('input[name="gdpr"]').val();

    if(loginObj.agreedterms === 'on'){
        loginObj.agreedterms = 1
    };

    var logURL = loginObj.base_url+$.param(loginObj);
    $("#loginURI").html('<a href="'+logURL+'">'+logURL+'</a>');

    //Poll data using the loginURL
    var logResp = $.ajax({
        url: logURL,
        type: "GET",
        async: false,
        dataType: "json"
        }).done( function(data) {
            $("#loginResponse").text(JSON.stringify(data));

        //data.data.apikey; -hardcoded for development (PM) THIS NEEDS TO BE REMOVED PROJECT IS LIVE
        loginObj['apikey'] = data.data.apikey;
        loginObj['userid'] = data.data.userid;
        loginObj['first_name'] = data.data.first_name;
        loginObj['last_name'] = data.data.last_name;
        loginObj['job_title'] = data.data.job_title;
        loginObj['sharedetails'] = data.data.sharedetails;
        loginObj['organisation'] = data.data.organisation;
        // Didncollect email as it should be same

        loginObj['agreedterms'] = data.data.agreedterms;
        loginObj['conf_name'] = data.data.conf_name;
        
        loginObj['conf_map_lat'] = data.data.conf_mapcoords.lat;
        loginObj['conf_map_lon'] = data.data.conf_mapcoords.lng;
        
        //Little step to turn base64 conference data into image
        loginObj['conf_image_data'] = data.data.conf_image;
        var img = new Image();
        img.src = "data:image/png;base64,"+loginObj['conf_image_data']; //The first part is the header which is not stored on the database
        loginObj['conf_image'] = img;
        loginObj['conf_descr'] = data.data.conf_descr;
        //console.log(JSON.stringify(loginObj));
        //We post another call to update agree terms - as they must be agreed for submission of the form
        loginObj_subset = pick(loginObj, ['apikey'])
        loginObj_subset.action = "getseminars";
        var logURL = loginObj.base_url + $.param(loginObj_subset);
        $.ajax({
            url: logURL,
            type: "GET",
            async: false,
            dataType: "json"
        }).done(function(data){
        //A few values are recorded to show that the user has logged in successfully and the ID can now be used to return specific data from the local database and the API calls
            console.log(data);
            if(data["success"] = true){
                MultipleUser = loginObj.attendeeref;
                loginDetails = data.data;
                for (result in loginDetails) {
                    record = loginDetails[result];
                    for (value in record){
                        console.log(record[value]);
                    }
                    result = record[value];
                    console.log(record);
                    SeminarID = record["id"];
                    }
            }
        })
        })//End Done part of main Login call
    fill_conference_data();
    get_attendees(); //Poll the latest attendees data from the database
    });//END API Call

////FIND PEOPLE PAGE
//Number of attendees
//#people_list_caption


//Create template for HTML
var attendee_html_block = `<button id="unique_attendee_Related_id_1" class=" ui-btn ui-shadow ui-corner-all">
                    <p>Forename Surname</p><div>
                        <p>Organization</p>
                        <a href="#" class="ui-link">more</a>
                    </div>
                </button>`;

function get_attendees(){
    //POLL ATTENDEES FROM API AND ADD TO LOCAL STORAGE
    var isOffline = 'onLine' in navigator && !navigator.onLine;
    if (! isOffline ){
        // PM - If there is an Internet connection then the table values will be deleted and refreshed, otherwise the local values will remain -- There is a question regarding multiple events
        console.log("Connection Established")
        loginObj_subset = pick(loginObj, ['apikey'])
        loginObj_subset.action = "getattendees";
        var logURL = loginObj.base_url + $.param(loginObj_subset);
        console.log(logURL);
        var logResp = $.ajax({
            url: logURL,
            async: false,
            type: "GET",
            dataType: "json"
            }).done( function(data) {
            attendeesArray = data.data; // PM - This is the data from the JSON which needs to be extracted to be inserted into the database below
            /*drop table when testing --PM This was something useful to add when testing to completely wipe the table and make a new one below
            db.transaction(function(tx) {
                tx.executeSql( 'Drop table Attendees;' ,[],nullHandler,errorHandler);},errorHandler,successCallBack);
                console.log("Table Dropped");
            */
            //PM - make a new table for Attendees if it isn't already there (first load) -This is an empty table at this point and will not be processed if the table already exists from a previous load
            db.transaction(function(tx){
                tx.executeSql('CREATE TABLE if not exists Attendees (reference nvarchar(100) not null  PRIMARY KEY, first_name nvarchar(100) null,last_name nvarchar(100) null,organisation nvarchar(100) null,job_title nvarchar(100) null,bio text null,profileimg mediumtext null,profileimg_thumb text null)', [], nullHandler, errorHandler);
                }, errorHandler, successCallBack
            );
            console.log("Table Created");
            //PM - delete the data that is about to be refreshed so that there isn't duplicate data --this may need a where clause if we are looking at multiple seminars
            db.transaction(function(tx){
                tx.executeSql('Delete from Attendees;', [], nullHandler, errorHandler);
            }, errorHandler, successCallBack);
            console.log("Records Deleted");
            db.transaction(function(tx) {
                for (table in attendeesArray){
                    record = attendeesArray[table];
                    for (value in record){
                        fieldname = record[value]; // PM - the double nested for loop is used to extract the data from the JSON object - this gets down to the key values in the array
                        // PM - the new values are added to Attendees table from the JSON object using the names of the keys
                        if (typeof fieldname["reference"] != null) {
                            tx.executeSql( 'insert into Attendees values (?,?,?,?,?,?,?,?);',
                            [fieldname["reference"],
                            fieldname["first_name"],
                            fieldname["last_name"],
                            fieldname["organisation"],
                            fieldname["job_title"],
                            fieldname["bio"],
                            fieldname["profileimg"],
                            fieldname["profileimg_thumb"]],
                            nullHandler,errorHandler);
                        } 
                    }
                }
            }, errorHandler, successCallBack);
        })
    

        // PM - Data is retrieved from the Attendees local table ordered by attendee surname, last name (ascending)
        db.transaction(function(transaction) {
            console.log("Running attendees");
            transaction.executeSql('SELECT * FROM Attendees order by last_name, first_name;', [],
            function(transaction, result) {
                if (result != null && result.rows != null) {
                    var output = "";
                    var holder; 
                    for (var i = 0; i < result.rows.length; i++) {
                        var row = result.rows.item(i);
                        
                        holder = attendee_html_block.replace("attendee_id", row.reference);
                        
                        holder = holder.replace("Forename", row.first_name);
                        holder = holder.replace("Surname", row.last_name);
                        holder = holder.replace("Organization", row.organisation);
                        holder = holder.replace('href="#"', 'href="STRESS"');
                        output += holder;   

                    }
               
                $("#people_list").html('<div id="people_list">'+output+'</div>');
                }
            },  errorHandler);
        }, errorHandler, nullHandler);
    };  // PM - end of the if statement if there is an internet connection

}


function fill_conference_data(){
    //$("div.banner").html(loginObj['conf_image']);
    $("#conference_name").html(loginObj['conf_name']);
    $("#more_conference_info > p").html(loginObj['conf_descr']);

    $("#addr_icon > img").wrap($('<a>',{
        href: 'comgooglemaps://?center='+loginObj.conf_map_lat+','+loginObj.conf_map_lat+'&zoom=14'
    }));
    
}











