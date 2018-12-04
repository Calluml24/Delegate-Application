$(document).ready(function(){
    //This will need to be removed when it's uploaded to phone...
    document.addEventListener('deviceready', onDeviceReady,false);
    //onDeviceReady();
});



//ondeviceready - NOTE FUNCTIONS AND VARS IN HERE ARE IN LOCAL SCOPE

function onDeviceReady(){
        //console.log("Device Ready.");
        attendees = new Object(); //this can be done on declaration
}  //END OF ONDEVICEREADY



//VARIABLES
//Phil's variables need to be declared in global scope if we want to access them elsewhere 

var MultipleUser = ""; // Used to read the login ID so database gets data for individual user
// PM - Local database global variables - This creates a database and gives it a name with a few MySQL parameters such as size
var db;//the db
//PM - Connect to database using the variables above. This can be repeated if we are using multple pages and will log on to the same database created before (it does not overwrite the database)
db = openDatabase(shortName, version, displayName,maxSize);
var shortName = 'SqlDB';
var version = '1.0';
var displayName = 'SqlDB';
var maxSize = 65535;

//Sham - I've declared these variables here instead of in the code below. shouldn't have any adverse effect but might prevent scope problems. Previously declared within functions.

var loc;


//This object holds login details for the user
var loginObj = new Object();
loginObj.base_url = "https://keele.bookmein2.com/api/api.php?";
var attendees;
var pick;

//this is for the synch time
var lastupdate;

//Create template for HTML for attendee block
var attendee_html_block = `<button class="personlist ui-btn ui-shadow ui-corner-all">
                    <p>Forename Surname</p><div>
                        <p>Organization</p>
                        <h3 idsquiggle class="clickbuttongetgetperson" style="color:blue">more...</h3>
                    </div>
                </button>`;

//Create template for HTML for agenda block
var agenda_html_block = `<button idsquiggle3 class="ui-btn ui-shadow ui-corner-all">
                    <h2>Event name <br>
                        Location<br>
                        <span class="grey_txt"> 4/2/2018 16:30 </span>
                    </h2>
                </button>`;

//Create template for HTML for Manage Meeting block
var meeting_html_block = `<button idsquiggle2 class="meetingbutton ui-btn ui-shadow ui-corner-all">
                    <h3 class="left">Forename Surname <br> Organization </h3>
                    <h1 class="right">@</h1>                 
                    <br style="clear:both;">
                    <h3 class="left">Time</h3>
                    <h4 class="right red">1hr 4m ago</h4>
                </button>`;






//LISTENERS
/* Jane's listeners in one place */

//################# reply meeting JS code##################################
$(document).on('click',"#back_btn",function() {
    location.href = "#delegateManage_Meeting";//temp code switches to generic home for now for demonstration purposes
});

//################# person profile page JS code##################################
$(document).on('click',"#arrange_meeting_btn",function() {
        document.getElementById("arrange_meeting_btn").style.display = "none";      
        document.getElementById("person_profile_meeting_schdlr_div").style.display = "initial";
});

$(document).on('click',"#cancel_schdlr_btn",function() {     
        document.getElementById("person_profile_meeting_schdlr_div").style.display = "none";
        document.getElementById("arrange_meeting_btn").style.display = "initial";
}); 

//Sham - for the picture update function
$(document).on('click',"#takepic",picker); 

//#################Index page JS code##################################
//change to login page
$(document).on('click',"#login_btn",function() {		
	location.href = "#delegateLogin";
});


//gets id of clicked button as e.target.id for now
$(document).on('click',"#user_conferences",function(e) {     
    var clicked_button_Id = e.target.id;
    ////console.log("clicked_button_id: " + clicked_button_Id);
    location.href = "#delegateHome";//temp code switches to generic home for now for demonstration purposes
});   

//sets target attendeeref when you click a person, then loads data and redirects to profile
$(document).on('click',".clickbuttongetgetperson",function(e) {     
    var clicked_button_Id = e.target.id;
    ////console.log("clicked_button_id: " + clicked_button_Id);
    loginObj.target_attendeeref = clicked_button_Id;
    getattendee();
    location.href = "#delegatePerson_Profile";
});   

//gets meeting id and then load_target directs to correct page
$(document).on('click',".meetingbutton",function(e) {     
    var clicked_button_Id = $(this).closest("button").attr('id');
    ////console.log("clicked_button_id: " + clicked_button_Id);
    loginObj.meeting_id = clicked_button_Id.replace("meeting","");
    load_target();
    ////console.log(loginObj.meeting_id);
});   

//reload profile when cancel user profile clicked
$(document).on('click',"#reset_profile_btn",function() {     
    fill_profile_details();
});   

//open maps in native browser
$(document).on('click',"#addr_icon",function() {     
    if (device.platform.toUpperCase() === "ANDROID") {
        window.open("geo:" + loc, "_system");
    } else if (device.platform.toUpperCase() === "IOS") {
        window.open("http://maps.apple.com/?sll=" + loc + "&z=100&t=k", "_system");
    } else {
        alert("You aren't on Android or iOS, but you would have gone to : "+ loc + " in the native app.");
    }
});   


//synch button
$(document).on('click',".sync_info",function() {     
    refreshall();
});  

    

    
    
    
//Sham - add to pending GET request db when update user profile clicked
//pick() won't work for this so tempURL used.
//components encoded seperately so they don't break the request.
$(document).on('click',"#updt_profile_btn",function() { 
    
                var tempURL = loginObj.base_url;
                tempURL += "action=updateprofile";
                tempURL += "&apikey="+loginObj.apikey;
    //if there is a value (placeholders used so any change apart from change to empty is a value -needs changing to not use placeholders to address the edge case when someone wants to empty a field (can use a . for now))
    if($('#delegateUser_Profile').find('input[name="role"]').val()){
                tempURL += "&job_title="+encodeURIComponent($('#delegateUser_Profile').find('input[name="role"]').val());
        //change loginObj details to reflect changes, as we don't want them to have to log in again to see it.
        //if profile was populated from get_attendees and not loginObj we wouldn't need this
                loginObj.job_title = $('#delegateUser_Profile').find('input[name="role"]').val();
    };
    if($('#delegateUser_Profile').find('textarea[name="bio"]').val()){            
                tempURL += "&bio="+encodeURIComponent($('#delegateUser_Profile').find('textarea[name="bio"]').val());
                loginObj.bio = $('#delegateUser_Profile').find('textarea[name="bio"]').val();
    };
    if($('#delegateUser_Profile').find('input[name="f_name"]').val()){
                tempURL += "&first_name="+encodeURIComponent($('#delegateUser_Profile').find('input[name="f_name"]').val());
                loginObj.first_name = $('#delegateUser_Profile').find('input[name="f_name"]').val();
    };
    if($('#delegateUser_Profile').find('input[name="s_name"]').val()){
                tempURL += "&last_name="+encodeURIComponent($('#delegateUser_Profile').find('input[name="s_name"]').val());
                loginObj.last_name = $('#delegateUser_Profile').find('input[name="s_name"]').val();
    };
    if($('#delegateUser_Profile').find('input[name="org"]').val()){
                tempURL += "&organisation="+encodeURIComponent($('#delegateUser_Profile').find('input[name="org"]').val());
                loginObj.organisation = $('#delegateUser_Profile').find('input[name="org"]').val();
    };
                //console.log(tempURL);
                addPendingMeeting(tempURL,MultipleUser);
                //then reload so it goes grey
                fill_profile_details();
                $("#myprofileform")[0].reset();
});   



//REQUEST MEETING 
//#send_meeting_btn
//Sham- gets form/login data to generate a GET request to send a meeting invite, sends URL to addPendingMeeting (Queue)
$(document).on('click',"#send_meeting_btn",function() {
                //extract the data from the form
                //https://keele.bookmein2.com/api/api.php?action=requestmeeting&apikey=Ng0JSqBg07OGUnhOJoZKTLIHmjeMbfwPlmo4DPauNO0y28cBm1&receiveref=w00016&message=Message
                loginObj_subset = pick(loginObj, ['apikey']);
                loginObj_subset.action = "requestmeeting";
                loginObj_subset.receiverref = loginObj.target_attendeeref;
                loginObj_subset.message = $('#person_profile_meeting_schdlr_div > fieldset:nth-child(3) > textarea').val();
                loginObj_subset.meeting_date = $('#person_profile_meeting_schdlr_div > fieldset:nth-child(1) > div > input').val();
                loginObj_subset.location = ($('#person_profile_meeting_schdlr_div > fieldset:nth-child(2) > div > input').val());
                var logURL = loginObj.base_url + $.param(loginObj_subset);
                //console.log(logURL);
                addPendingMeeting(logURL,MultipleUser);
                location.href = "#delegateFind_People";
});


//Accept meeting
//Sham- gets form/login data to generate a GET request to send a meeting response -  accept, sends URL to addPendingMeeting (Queue)
$(document).on('click',"#accept_meeting_btn",function() {
            loginObj_subset = pick(loginObj, ['apikey']);
            loginObj_subset.action = "respondmeeting";
            //console.log($('#Reply_meeting_schdule > fieldset:nth-child(6) > textarea').val());
            loginObj_subset['message'] = $('#Reply_meeting_schedule > fieldset:nth-child(7) > textarea').val();
            loginObj_subset.meetingid = loginObj.meeting_id;
            loginObj_subset.type = "accept";
            var logURL = loginObj.base_url + $.param(loginObj_subset);
            addPendingMeeting(logURL,MultipleUser);
            location.href = "#delegateManage_Meeting";
});


//Decline meeting
//Sham- gets form/login data to generate a GET request to send a meeting response - decline, sends URL to addPendingMeeting (Queue)
$(document).on('click',"#reject_schdlr_btn",function() {
            loginObj_subset = pick(loginObj, ['apikey']);
            loginObj_subset.action = "respondmeeting";
            loginObj_subset['message'] = $('#Reply_meeting_schedule > fieldset:nth-child(7) > textarea').val();
            loginObj_subset.meetingid = loginObj.meeting_id;
            loginObj_subset.type = "refuse";
            var logURL = loginObj.base_url + $.param(loginObj_subset);
            addPendingMeeting(logURL,MultipleUser);
            location.href = "#delegateManage_Meeting";
        });

//Amend meeting
//Sham- gets form/login data to generate a GET request to send a meeting response - amend, sends URL to addPendingMeeting (Queue)
//NB this sets meeting panel to open and redirects to person profile
$(document).on('click',"#amend_meeting_btn",function() {
            loginObj_subset = pick(loginObj, ['apikey']);
            loginObj_subset.action = "respondmeeting";
            loginObj_subset['message'] = $('#Reply_meeting_schedule > fieldset:nth-child(7) > textarea').val();
            loginObj_subset.meetingid = loginObj.meeting_id;
            loginObj_subset.type = "rearrange";
            var logURL = loginObj.base_url + $.param(loginObj_subset);
            addPendingMeeting(logURL,MultipleUser);
            document.getElementById("arrange_meeting_btn").style.display = "none";      
            document.getElementById("person_profile_meeting_schdlr_div").style.display = "initial";
            location.href = "#delegatePerson_Profile";
        });

//Sham -GDPR terms modal click to close
$(document).on('click',"#gdpr_terms_modal",function() {
            $("#gdpr_terms_modal").attr("style",'display:none;');
    });	
	



//Sham - I think this should be a function with a listener calling it, as it isn't good for the structure of the file like this.
//LOgin - page2
//Poll API and return API key needed for subsequent calls
$(document).on('click',"#log_in_btn",function(e){
    
    //console.log("click");
    //evt.preventDefault(); //prevents the default action
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
            //console.log(JSON.stringify(data));
            //console.log("JSON LOGIN DATA");

            //data.data.apikey; -hardcoded for development (PM) THIS NEEDS TO BE REMOVED PROJECT IS LIVE
            loginObj['apikey'] = data.data.apikey;
            loginObj['userid'] = data.data.userid;
            loginObj['first_name'] = data.data.first_name;
            loginObj['last_name'] = data.data.last_name;
            loginObj['job_title'] = data.data.job_title;
            loginObj['sharedetails'] = data.data.sharedetails;
            loginObj['organisation'] = data.data.organisation;
            // Didncollect email as it should be same
            loginObj['profileimg_thumb'] = "https://keele.bookmein2.com/images/profile/"+data.data.profileimg_thumb;

            loginObj['agreedterms'] = data.data.agreedterms;
            loginObj['conf_name'] = data.data.conf_name;
            loginObj['conf_map_loc'] = data.data.conf_mapcoords;
            loginObj['bio'] = data.data.bio;

            loginObj['target_attendeeref'] = data.data.reference; //This variable is used to poll individuals
            loginObj['meeting_id'] = 1;

            //Little step to turn base64 conference data into image 
            //Sham - WHY????
            loginObj['conf_image_data'] = data.data.conf_image;
            var img = new Image();
            img.src = "data:image/png;base64,"+loginObj['conf_image_data']; //The first part is the header which is not stored on the database
            loginObj['conf_image'] = img;
            loginObj['conf_desc'] = data.data.conf_desc;
            ////console.log(JSON.stringify(loginObj));
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
                //console.log(data);
                if(data["success"] = true){
                    MultipleUser = loginObj.attendeeref;
                    loginDetails = data.data;
                    for (result in loginDetails) {
                        record = loginDetails[result];
                        for (value in record){
                            //console.log(record[value]);
                        }
                        result = record[value];
                        //console.log(record);
                        SeminarID = record["id"];
                        }
                }
            })
            })//End Done part of main Login call
     // The FireMessagesToServer repeats every two minutes to pass messages to server  

            /*
            CURRENTLY COMMENTED OUT BECAUSE OF ERROR HANDLING
            Sham - I put a synch button in so the app doesn't constantly use data and autosynch when sending a message/response. 
            setInterval(function(){
                FireMessgesToServer(db), 120000
            });
            
            */  
            
            fill_conference_data();
            get_attendees(); //Poll the latest attendees data from the database
            fill_profile_details();
            get_agenda();
            ShowMeetings('All');//
            //FireMessgesToServer(db);
            location.href = "#delegateIndex";
            });//END API Call

    
    


//Page change listener - calls functions to make this readable. NB due to the way the "pages" are loaded we cannot put this inside the document ready function.
//Sham - this and the below are there for expandability, can be used for selective synch so only page relevant data is refreshed.
$(document).on( "pagecontainerchange", function( event, ui ) {
    
    switch (ui.toPage.prop("id")) {
        case "delegateIndex":
            delegateIndexInit();
            break;
        case "delegateLogin":
            delegateLoginInit();
            break;
        case "delegateHome":
            delegateHomeInit();
            break;
        case "delegateAgenda":
            delegateAgendaInit();
            break;
        case "delegateConfirmed_Meeting":
            delegateConfirmed_MeetingInit();
            break;
        case "delegateFind_People":
            delegateFind_PeopleInit();
            break;
        case "delegateManage_Meeting":
            delegateManage_MeetingInit();
            break;
        case "delegatePerson_Profile":
            delegatePerson_ProfileInit();
            break;
        case "delegateReply_Meeting":
            delegateReply_MeetingInit();
            break;
        case "delegateUser_Profile":
            delegateUser_ProfileInit();
            break;
        default:
            alert("NO PAGE INIT FUNCTION")
            break;
            
    }
});



//FUNCTIONS
//Sham - Init functions (run on page change - NOT ONCE) are below.

function delegateIndexInit(){
    //console.log("Index Page Init Function");
}

function delegateLoginInit(){
    //console.log("Login Page Init Function");
    //clear form data
}

function delegateHomeInit(){
    //console.log("Home Page Init Function");
    setlastupdatedtime();
}

function delegateAgendaInit(){
    //console.log("Agenda Page Init Function");
    setlastupdatedtime();
}

function delegateConfirmed_MeetingInit(){
    //console.log("Confirmed_Meeting Page Init Function");
    setlastupdatedtime();
}

function delegateFind_PeopleInit(){
    //console.log("Find_People Page Init Function");
    setlastupdatedtime();
}

function delegateManage_MeetingInit(){
    //console.log("Manage_Meeting Page Init Function");
    setlastupdatedtime();
    //clear respond message data
}

function delegatePerson_ProfileInit(){
    //console.log("Person_Profile Page Init Function");
    setlastupdatedtime();
    //console.log(loginObj.target_attendeeref);
    //clear meeting input data
}

function delegateReply_MeetingInit(){
    //console.log("Reply_Meeting Page Init Function");
    setlastupdatedtime();
    //clear input data
}

function delegateUser_ProfileInit(){
    //console.log("User_Profile Page Init Function");
    setlastupdatedtime();
}





//################# home page JS code##################################
//Jane's function
function hide_div(div_id) {   
   document.getElementById(div_id).classList.toggle("hide");
}
//Jane's function
function toggle_content(current, alternative) { 
   hide_div(current);
   hide_div(alternative);
}

//Sham-the corresponding hide listener is in the listeners section above
function show_terms_modal() {	
	document.getElementById("gdpr_terms_modal").style.display = "initial"; 	
}


//Sham - allow user to select a picture if they are online
function picker(){
    var isOffline = 'onLine' in navigator && !navigator.onLine;
    if(isOffline){
        alert("You cannot upload a picture while offline.");
    } else {
        navigator.camera.getPicture(picreplace,picstaysame,{
        sourceType: Camera.PictureSourceType.SAVEDPHOTOALBUM,
        destinationType: Camera.DestinationType.DATA_URL});
    };
}

//Sham -send the picture data as a POST request. Note this only accepts jpg but will not validate upload.
//Validating data type not just by filename should be added - less of an issue if mobile only app. 
function picreplace(imageData) {
    tempURL = loginObj.base_url;
    var postData = new Object();
    postData['action'] = "setpic";
    postData['apikey'] = loginObj.apikey;
    postData['pic'] = "data:image/jpeg;base64,"+imageData;
    var apiResp = $.ajax({
            url: tempURL,
            async: false,
            type: "POST",
            dataType: "json",
            data: postData,
            proccessData: false,
            }).done( function(data) {
                var temparray = data.data;
                //console.log(temparray);
                if(temparray.profileimg_thumb!="https://keele.bookmein2.com/images/profile/null"){
                    loginObj.profileimg_thumb = temparray.profileimg_thumb;
                };
                updateuserimagedisplay();
            });     
    //document.getElementById("disply").src= "data:image/jpeg;base64," + imageData; 
}

//Sham - if the picture upload fails or choice is not made an alert helps.
function picstaysame(message){
    alert('Failed because: ' + message);
}



//This is a utility function to select certain keys from loginObj for URL calls
pick = function (obj, attrs) {
    return attrs.reduce(function (result, key) {
    result[key] = obj[key];
    return result;
    }, {});
};
    

//Sham -Gets latest attendee list, updates database info and propagates (Including user information to allow multiple logged in devices reflecting changes)
function get_attendees(){
    //POLL ATTENDEES FROM API AND ADD TO LOCAL STORAGE
    var isOffline = 'onLine' in navigator && !navigator.onLine;
    if (! isOffline ){
        // PM - If there is an Internet connection then the table values will be deleted and refreshed, otherwise the local values will remain -- There is a question regarding multiple events
        //console.log("Connection Established")
        loginObj_subset = pick(loginObj, ['apikey'])
        loginObj_subset.action = "getattendees";
        var logURL = loginObj.base_url + $.param(loginObj_subset);
        //console.log(logURL);
        var logResp = $.ajax({
            url: logURL,
            async: false,
            type: "GET",
            dataType: "json"
            }).done( function(data) {
                attendeesArray = data.data; // PM - This is the data from the JSON which needs
                //to be extracted to be inserted into the database below
                /*drop table when testing --PM This was something useful to add when testing to completely wipe the table and make a new one below
                db.transaction(function(tx) {
                    tx.executeSql( 'Drop table Attendees;' ,[],nullHandler,errorHandler);},errorHandler,successCallBack);
                    //console.log("Table Dropped");
                */
                //PM - make a new table for Attendees if it isn't already there (first load) -This is an empty table at this point and will not be processed if the table already exists from a previous load
                db.transaction(function(tx){
                    tx.executeSql('CREATE TABLE if not exists Attendees (reference nvarchar(100) not null  PRIMARY KEY, first_name nvarchar(100) null,last_name nvarchar(100) null,organisation nvarchar(100) null,job_title nvarchar(100) null,bio text null,profileimg mediumtext null,profileimg_thumb text null)', [], nullHandler, errorHandler);
                    }, errorHandler, successCallBack
                );
                //console.log("Table Created");
                //PM - delete the data that is about to be refreshed so that there isn't duplicate data --this may need a where clause if we are looking at multiple seminars
                db.transaction(function(tx){
                    tx.executeSql('Delete from Attendees;', [], nullHandler, errorHandler);
                }, errorHandler, successCallBack);
                //console.log("Records Deleted");
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
            //console.log("Running attendees");
            transaction.executeSql('SELECT * FROM Attendees order by last_name, first_name;', [],
            function(transaction, result) {
                if (result != null && result.rows != null) {
                    var output = "";
                    var holder;
                    for (var i = 0; i < result.rows.length; i++) {
                        var row = result.rows.item(i);
                        if(row.reference == loginObj.attendeeref){//if it is the user update loginObj
                            loginObj.first_name = row.first_name;
                            loginObj.last_name = row.last_name;
                            loginObj.organisation = row.organisation;
                            loginObj.job_title = row.job_title;
                            loginObj.bio = row.bio;
                            loginObj.profileimg_thumb = "https://keele.bookmein2.com/images/profile/"+row.profileimg_thumb;
                            
                            //console.log("LoginObj in getattendees");
                            //console.log(loginObj);
                            
                        } else { //it isn't the user add to list of placeholders
                        holder = attendee_html_block//.replace("attendee_id", row.reference);
                        holder = holder.replace("Forename", row.first_name);
                        holder = holder.replace("Surname", row.last_name);
                        holder = holder.replace("idsquiggle", "id='"+row.reference+"'");
                        holder = holder.replace("Organization", row.organisation);
                      //  holder = holder.replace('href="#"', 'href="index.html#delegatePerson_Profile"');
                        output += holder;
                        };

                    }

                $("#people_list").html('<div id="people_list">'+output+'</div>');
                }
            },  errorHandler);
        }, errorHandler, nullHandler);
        //Sham- last synch is changed with every major update type. This is for completeness and needs attention once server load/bandwidth limitations are considered to set an update schedule.
        lastupdate = Date.now();
    };  // PM - end of the if statement if there is an internet connection

}

    
    
    
    
//Sham- updates Agenda information from the api if online, to the db, then from the db on or offline to propagate pages.    
function get_agenda(){
    //POLL SEMINARS FROM API AND ADD TO LOCAL STORAGE
    var $AgendaList = "";//PM - reset the string variable
    loginObj_subset = pick(loginObj, ['apikey'])
    loginObj_subset.action = "getagenda";
    var isOffline = 'onLine' in navigator && !navigator.onLine;
    if (! isOffline ){
            // PM - If there is an Internet connection then the table values will be deleted and refreshed, otherwise the local values will remain
            //console.log("Connection Established: agenda");
            var logURL = loginObj.base_url + $.param(loginObj_subset);
            var logResp = $.ajax({
                url: logURL,
                async: false,
                type: "GET",
                dataType: "json"
                }).done(function(data){
                 
                    /*drop table when testing - //PM - same as previous
                    db.transaction(function(tx) {
                        tx.executeSql( 'Drop table Meetings;' ,
                        [],nullHandler,errorHandler);
                        },  errorHandler,   successCallBack);
                    db.transaction(function(tx) {
                        tx.executeSql('Drop table Seminars;' ,
                        [],nullHandler,errorHandler);
                    },  errorHandler,   successCallBack);
                    //console.log("Table Dropped")
                    */
                 
                    //PM - make new tables if it isn't already there (first load) Two tables need to be made here as the agenda data is gathered in a union query
                    db.transaction(function(tx){
                        tx.executeSql('CREATE TABLE if not exists Meetings (id integer not null ,    meeting_date datetime null,    date_sent datetime null,    sender_message text null,    location nvarchar(100) null,    sender_reference nvarchar(100) not null,    receiver_response text null,    receiver_reference nvarchar(100) null,    sender_first_name nvarchar(100) null,    sender_last_name nvarchar(100) null,    sender_organisation nvarchar(100) null,    sender_job_title nvarchar(100) null,    sender_bio text null,    receiver_first_name nvarchar(100) null,    receiver_last_name nvarchar(100) null,    receiver_organisation nvarchar(100) null,    receiver_job_title nvarchar(100) null,    receiver_bio text null,    status nvarchar(100) null,    last_update datetime null)',
                            [],nullHandler,errorHandler);
                    },errorHandler,successCallBack);
                    //make a new seminar table if it isn't already there (first load)
                    db.transaction(function(tx){
                        tx.executeSql( 'CREATE TABLE if not exists Seminars (  id integer not null ,    seminar_reference nvarchar(100) null,    seminar_name nvarchar(100) null,    start_time datetime null,    end_time datetime null,    preegonly text null,    capacity integer null,    location nvarchar(100) null,    registered integer null)',
                            [],nullHandler,errorHandler);
                    },errorHandler,successCallBack);
                    //console.log("Tables Created");
                 
                    //remove old versions of data from accepted meeting and seminars that are about to be refreshed
                    db.transaction(function(tx) {
                        tx.executeSql( 'Delete from Meetings where status = "Accepted"  and (sender_reference = ? or receiver_reference = ?)',//PM - NEED TO CHANGE THIS IN API - PENDING MESSAGES ARE SHOWING WHICH IS CAUSING UNIQUE VALUE ERRORS - primary keys removedfrom tables to fix this although this should only be a temporary change
                            [MultipleUser,
                            MultipleUser],
                            nullHandler,errorHandler);
                    },  errorHandler,   successCallBack);
                 
                    db.transaction(function(tx) {
                        tx.executeSql('Delete from Seminars',
                            [],nullHandler,errorHandler);
                    }, errorHandler, successCallBack);
                 
                    db.transaction(function(tx) {
                        agendaArray = data.data;
                        //console.log(agendaArray);
                        for (table in agendaArray){
                            //console.log("table");
                            //console.log(table);
                            record = agendaArray[table];
                            //console.log("record");
                            //console.log(record);
                            if(record["type"]=="meeting") {
                                //PM - extract the data frmo the JSON object - see console log when loading for more information - the type key value is used to seperate the records returned into the appropriate tables
                                //console.log("meeting")
                                tx.executeSql( 'insert into Meetings values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);',
                                [record["id"],
                                record["meeting_date"],
                                record["date_sent"],
                                record["sender_message"],
                                record["location"],
                                record["sender_reference"],
                                record["receiver_response"],
                                record["receiver_reference"],
                                record["sender_first_name"],
                                record["sender_last_name"],
                                record["sender_organisation"],
                                record["sender_job_title"],
                                record["sender_bio"],
                                record["receiver_first_name"],
                                record["receiver_last_name"],
                                record["receiver_organisation"],
                                record["receiver_job_title"],
                                record["receiver_bio"],
                                record["status"],
                                record["last_update"],
                                ], nullHandler, errorHandler);
                            };
                         
                            if(record["type"]=="seminar") {
                            //PM - the seminar records are extracted here
                                //console.log("seminar");
                                //console.log(record["id"]);
                                if (typeof record["id"] != null) {
                                    tx.executeSql( 'insert into Seminars (id, seminar_name,start_time,end_time,location) values (?,?,?,?,?);',
                                        [record["id"],
                                        record["name"],
                                        record["start_time"],
                                        record["end_time"],
                                        record["location"]],
                                        nullHandler, errorHandler);
                                }
                            }
                        }//For loop
                    }, errorHandler, successCallBack);
                });
            lastupdate = Date.now();
            }//PM - once live data has been refreshed from online source, the local database can be accessed to show the information
         
         
            db.transaction(function(transaction) {
            //PM - the data needs to be selected from a union query where the row order is key to getting the data. There must be the same number of rows in each part of the union query hence the amount of nulls whene getting the seminar information. This is ordered by the third column which is date ascending. I have renamed some of the fields returned to First Second Third to make it less confusing in the string below
            transaction.executeSql('select "Meeting" as Type,id as ID,meeting_date as First,    date_sent as Second,    sender_message as Third,    location as Forth,    sender_reference,    receiver_response,    receiver_reference,    sender_first_name,    sender_last_name,    sender_organisation,    sender_job_title,    sender_bio,    receiver_first_name,   receiver_last_name,   receiver_organisation,    receiver_job_title,    receiver_bio,        status,last_update from Meetings  where status = "Accepted"  and (sender_reference = ? or receiver_reference = ?)  union    select "Seminar" as Type,id, start_time as First, end_time as Second, seminar_name as Third,  location as Fourth ,null ,null ,null ,null ,null ,null ,null ,null ,null ,null ,null ,null ,null ,null ,null  from Seminars order by 3', 
                [MultipleUser,
                MultipleUser],
                function(transaction, result) {
                if (result != null && result.rows != null) {
                    var output = "";
                    var holder;
                    for (var i = 0; i < result.rows.length; i++) {
                        var row = result.rows.item(i);
                        if(row.Type == "Meeting") {
                            //console.log("Meeting");
                            //console.log(row);
 
                            //Create templates for HTML from agenda block
 
                            holder = agenda_html_block.replace('idsquiggle3 class="ui-btn ui-shadow ui-corner-all"', 'id="meeting'+row.ID+'" class="meetingbutton ui-btn ui-shadow ui-corner-all"');
                            //If row.sender_reference, the person who invited is the person logged in, display the receiver and vice versa
                            if(row.sender_reference == loginObj.attendeeref){//If it is the user who proposed the meeting
                                holder = holder.replace("Event name <br>", "Meet " + row.receiver_first_name+ " " + row.receiver_last_name + ",<br> " + row.receiver_job_title + " - " + row.receiver_organisation + "<br>");
                            } else{//If it is not the user
                                holder = holder.replace("Event name <br>", "Meet " + row.sender_first_name+ " " + row.sender_last_name + ",<br> " + row.sender_job_title + " - " + row.sender_organisation + "<br>");
                            };
                            holder = holder.replace('Location<br>',"At: "+row.Forth+"<br>"); //The location field appears to be missing for some reason
                            holder = holder.replace('<span class="grey_txt"> 4/2/2018 16:30 </span>', '<span class="grey_txt">On: ' + row.First + '</span>');
                            holder = holder.replace('h2',"h3"); //makes the seminars stand out more
                            output += holder;
                            };
                    if(row.Type == "Seminar") {
                        //console.log("Seminar");
                        //console.log(row);
                        holder = agenda_html_block.replace('idsquiggle3 class="ui-btn ui-shadow ui-corner-all"', 'id="seminar'+row.ID+'" class="seminarbutton ui-btn ui-shadow ui-corner-all"');
                        holder = holder.replace("Event name <br>", row.Third + "<br>");
                        holder = holder.replace('Location<br>', row.Forth + "<br>"); 
                        holder = holder.replace('<span class="grey_txt"> 4/2/2018 16:30 </span>', '<span class="grey_txt">On: '+row.First+"<br> To: "+row.Second+'</span>');
                        output += holder;
                        //PM -  values for meetings and seminars are returned in these two addtitions to the string variable. As the for loop goes through the records it will order by date to see which oen needs to be selected next.
                    };
         
                }//FOr loop
                 $("#agenda_list").html('<div id="agenda_list">'+output+'</div>');
                //document.getElementById("AgendaP").innerHTML = $AgendaList;
            }//Engif
        },  errorHandler);
        },errorHandler,nullHandler);
    }
 
    
    
    
    
    
//Sham- updates meetings information from API to db then onto the manage meetings page    
function ShowMeetings($MeetingTypeSelected){
            
            
            var isOffline = 'onLine' in navigator && !navigator.onLine;
            // PM - If there is an Internet connection then the table values will be deleted and refreshed, otherwise the local values will remain
        
            if(! isOffline){
                //console.log("Connection Established");
                loginObj_subset = pick(loginObj, ['apikey']);
                //console.log(loginObj_subset);
                loginObj_subset.action = "getmeetings";
                //console.log(loginObj_subset.action);
                var logURL = loginObj.base_url + $.param(loginObj_subset);
                //console.log(logURL);
                var logResp = $.ajax({
                    url: logURL,
                    async: false,
                    type: "GET",
                    dataType: "json"
                    }).done(function(data) {
                        MeetingArray = data.data; //PM - get the data from the JSON object
                        //console.log(MeetingArray);
                    
                        /*drop table when testing
                        db.transaction(function(tx) {
                            tx.executeSql( 'Drop table if exists Meetings;' ,
                            [],nullHandler,errorHandler);
                            }, errorHandler, successCallBack);
                            //console.log("Table Dropped")
                        */
                        
                        //make a new table if it isn't already there (first load) - 
                        //same as attendees and seminar examples above
                        db.transaction(function(tx){
                            tx.executeSql( 'CREATE TABLE if not exists Meetings (id integer not null, meeting_date datetime null, date_sent datetime null,    sender_message text null,    location nvarchar(100) null,    sender_reference nvarchar(100) not null,    receiver_response text null,    receiver_reference nvarchar(100) null,    sender_first_name nvarchar(100) null,    sender_last_name nvarchar(100) null,    sender_organisation nvarchar(100) null,    sender_job_title nvarchar(100) null,    sender_bio text null,    receiver_first_name nvarchar(100) null,    receiver_last_name nvarchar(100) null,    receiver_organisation nvarchar(100) null,    receiver_job_title nvarchar(100) null,    receiver_bio text null,    status nvarchar(100) null,    last_update datetime null)',
                                [],nullHandler,errorHandler);
                        },errorHandler,successCallBack);
                        //console.log("Table Created");
                
                        //PM - remove the meeting data only for the attendee logged on to the app so that multiple user's information can be stored and accessed locally
                        db.transaction(function(tx){
                            tx.executeSql( 'Delete from Meetings where sender_reference = ? or receiver_reference = ?;',
                                [MultipleUser,
                                MultipleUser],
                                nullHandler,errorHandler);
                        },errorHandler,successCallBack);
                        //console.log("Records Deleted");
                        
                        db.transaction(function(tx) {
                            for (table in MeetingArray){
                                record = MeetingArray[table];
                                for (value in record){
                                    fieldname = record[value];
                                    //PM - add the refreshed data from the online database from the JSON object
                                    if (typeof fieldname["id"] != null) {
                                        tx.executeSql( 'insert into Meetings values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);', 
                                        [fieldname["id"],
                                        fieldname["meeting_date"],
                                        fieldname["date_sent"],
                                        fieldname["sender_message"],
                                        fieldname["location"],
                                        fieldname["sender_reference"],
                                        fieldname["receiver_response"],
                                        fieldname["receiver_reference"],
                                        fieldname["sender_first_name"],
                                        fieldname["sender_last_name"],
                                        fieldname["sender_organisation"],
                                        fieldname["sender_job_title"],
                                        fieldname["sender_bio"],
                                        fieldname["receiver_first_name"],
                                        fieldname["receiver_last_name"],
                                        fieldname["receiver_organisation"],
                                        fieldname["receiver_job_title"],
                                        fieldname["receiver_bio"],
                                        fieldname["status"],
                                        fieldname["last_update"],]
                                        ,nullHandler,errorHandler);
                                    }// End If
                                }
                            }//Outer for loop
                        }, errorHandler, successCallBack);
                    });//End AJax DOne
            lastupdate = Date.now();
                }//PM - once the data is refreshed, the local database is accessed for the meeting data
        
            
            db.transaction(function(transaction) {
                //PM - If 'ALL' is selected fromthe drop down list then messages are shown without the where clause
                if ($MeetingTypeSelected == 'All'){
                    transaction.executeSql('SELECT * FROM Meetings where sender_reference = ?  or receiver_reference = ? order by last_update desc;', 
                    [MultipleUser,
                    MultipleUser], //PM - messages shown where the sender or receiver is the user logged on
                    function(transaction, result) {
                        if (result != null && result.rows != null) {
                            var output = "";
                            var holder;
                            for (var i = 0; i < result.rows.length; i++) {
                                var row = result.rows.item(i);
                                //console.log(row);
                                 holder = meeting_html_block.replace("idsquiggle2", "id='meeting"+row.id+"'");
                                 //console.log(loginObj.attendeeref +" receiver: " + row.receiver_reference + row.receiver_first_name);
                                //gets the symbol for the meeting's status
                                var statussymbol = status_symbol(row.status);

                                if(loginObj.attendeeref == row.sender_reference){
                                    holder = holder.replace("Forename", "&rArr; " + row.receiver_first_name);
                                    holder = holder.replace("Surname", row.receiver_last_name);
                                    holder = holder.replace("Organization", row.receiver_organisation);
                                } else { 
                                    holder = holder.replace("Forename", "&lArr; " + row.sender_first_name);
                                    holder = holder.replace("Surname", row.sender_last_name);
                                    holder = holder.replace("Organization", row.sender_organisation);
                                };
                                holder = holder.replace("@",statussymbol);
                                holder = holder.replace("Time", row.meeting_date);
                                var updatemeeting = (new Date(row.last_update)).getTime();
                                holder = holder.replace('1hr 4m ago', "Updated: "+ since_time(updatemeeting));
                                output += holder;
                            }
                            $("#meetings_list").html('<div id="agenda_list">'+output+'</div>');
                        }
                    }, errorHandler);
                //PM - If Pending/ Accepted/ Rejected chosen then messages shown for these values only
                //Sham - the below code is not implemented yet so will not be tested. Only "All" meetings will be shown.
                } else {
                transaction.executeSql('SELECT * FROM Meetings where status in (?) and (sender_reference = ? or receiver_reference = ?) order by last_update desc;', 
                    [$MeetingTypeSelected,
                    MultipleUser,
                    MultipleUser], //PM - as above, messages shown if they are the user logged on
                    function(transaction, result) {
                        if (result != null && result.rows != null) {
                            var output = "";
                            var holder;
                            for (var i = 0; i < result.rows.length; i++) {
                                var row = result.rows.item(i);
                                holder = meeting_html_block.replace("idsquiggle2", "id='meeting"+row.id+"'");
                                var statussymbol = status_symbol(row.status);

                                if(row.sender_reference == loginObj.attendeeref){
                                    holder = holder.replace("Forename", "&rArr; " + row.receiver_first_name);
                                    holder = holder.replace("Surname", row.receiver_last_name);
                                    holder = holder.replace("Organization", row.receiver_organisation);
                                } else { 
                                    holder = holder.replace("Forename", "&lArr; " + row.sender_first_name);
                                    holder = holder.replace("Surname", row.sender_last_name);
                                    holder = holder.replace("Organization", row.sender_organisation);
                                };  
                                holder = holder.replace("@",statussymbol);
                                holder = holder.replace("Time", row.meeting_date);
                                var updatemeeting = (new Date(row.last_update)).getTime();
                                holder = holder.replace('1hr 4m ago', "Updated: "+ since_time(updatemeeting));
                                output += holder;
                                   
                            }
                            $("#meetings_list").html('<div id="agenda_list">'+output+'</div>');
                        }//Close if
                    }, errorHandler);//Close transaction
                }//Close IF
            },  errorHandler,   nullHandler);
            get_agenda();
                        
}



//Sham -returns symbol text for a meeting status
function status_symbol(status){
    var statussymbol;
        switch(status){
        case "Accepted":
            statussymbol = "&#10003;";
            break;
        case "Refused":
        case "Declined": //To display correct text on Confirmed Meeting - The case:case: is deliberate
            statussymbol = "&#10007;";
            break;
        case "Pending":
            statussymbol = "...";
            break;
        case "Rearrange":
        case "Amended"://see above comment
            statussymbol = "?";
            break;
        default:
            statussymbol = "";
            break;
    }
    return statussymbol;
}

//Sham -returns time since "time", formatted
//to <60s then <60m then <24h:0m then >1d depending on magnitude
//TIME MUST BE UNIX
function since_time(time){
    var thismoment = Date.now();
    var diff = thismoment - time;
    diff /= 1000;
    diff = Math.floor(diff);
    if(diff < 60) {
        return(diff+"s");
    } else {
        diff /= 60;
        diff = Math.floor(diff);
        if(diff < 60){
            return(diff+"m");
        } else {
            var hrs = diff / 60;
            hrs = Math.floor(hrs);
            if(hrs >=24){
                var days = Math.floor(hrs/24);
                return(days+"d");
            } else {
            diff %= 60;
            return(hrs+"h,"+diff+"m");
            }
        }
    }
}

//Sham - sets last updated fields to the time since lastupdate (run on page load)
function setlastupdatedtime(){
    var txttime = since_time(lastupdate);
    $(".sync_time").html(txttime);
}

//Sham -updates display of my profile image. placeholder if empty or offline, latest url if not.
function updateuserimagedisplay(){
    var isOffline = 'onLine' in navigator && !navigator.onLine;
    if (loginObj.profileimg_thumb!="https://keele.bookmein2.com/images/profile/null" && !isOffline){
        document.getElementById("disply").src = loginObj.profileimg_thumb;
    }
    else {
        document.getElementById("disply").src = "profile_placeholder.jpeg";
    };
}

//Sham - pulls loginObj.meeting_id data from db, gets status and changes then redirects to relevant meeting page.
//updates loginObj.target_attendeeref to the other party and calls getattendee() to update profile info
function load_target(){    
    db.transaction(function(transaction) {transaction.executeSql('SELECT * FROM Meetings where id = ?;', 
                        [loginObj.meeting_id],
                        function(transaction, result) {
                            if (result != null && result.rows != null) {
                                var output = "";
                                var holder;
                                for (var i = 0; i < result.rows.length; i++) {
                                    var row = result.rows.item(i);

                                    //console.log("row");
                                    //console.log(row);
                                    //console.log(row.sender_reference);
                                    //console.log(loginObj.attendeeref);
                                    if(row.sender_reference == loginObj.attendeeref){
                                        loginObj.target_attendeeref = row.receiver_reference;
                                    } else {
                                        loginObj.target_attendeeref = row.sender_reference;
                                    }
                                    getattendee();
                                    //For all replied to messages or pending where the user is the sender
                                    if(row.status=="Accepted" || row.status =="Refused" || row.status =="Rearrange" || (row.status=="Pending" && row.sender_reference == loginObj.attendeeref)){
                                        //Sham - change status to reflect client facing language when displaying text status.
                                        if(row.status=="Refused"){
                                            row.status="Declined";
                                        };
                                        if(row.status=="Rearrange"){
                                            row.status="Amended";
                                        };
                                        
                                        $("#Confirmed_meeting_schedule").find('input[name="schdlr_dt_tm"]').attr("placeholder", row.meeting_date);
                                        $("#Confirmed_meeting_schedule").find('input[name="schdlr_lctn"]').attr("placeholder", row.location);
                                        $("#Confirmed_meeting_schedule").find('textarea[name="schdlr_msg"]').attr("placeholder", row.sender_message);
                                        $("#Confirmed_meeting_status").html("Status: "+row.status+"  ("+status_symbol(row.status)+")");
                                        //Sham -If the sent message is pending then placeholder changed to "Awaiting reply..."
                                        if(row.status!="Pending"){
                                            $("#Confirmed_meeting_schedule").find('textarea[name="responder_msg"]').attr("placeholder", row.receiver_response);
                                            //console.log("receiving");
                                        } else {
                                            $("#Confirmed_meeting_schedule").find('textarea[name="responder_msg"]').attr("placeholder","Awaiting reply......");
                                            //console.log("awaiting");
                                        };
                                        
                                        location.href = "#delegateConfirmed_Meeting";
                                    } else if(row.status=="Pending" && row.sender_reference != loginObj.attendeeref){ //second statement to make it easier to see what the logic is.
                                         $("#Reply_meeting_schedule").find('input[name="schdlr_dt_tm"]').attr("placeholder", row.meeting_date); $("#Reply_meeting_schedule").find('input[name="schdlr_lctn"]').attr("placeholder", row.location);
                                        $("#Reply_meeting_schedule").find('textarea[name="schdlr_msg"]').attr("placeholder", row.sender_message);
                                        $("#Reply_meeting_status").html("Status: "+row.status+"  ("+status_symbol(row.status)+")");
                                        location.href = "#delegateReply_Meeting";
                                    } else {
                                        //Sham- for testing only, this has not triggered so far.
                                        alert("Invalid meeting status");        
                                    }
                                            
                                }
                        }
    
                    })});
}


        

//Sham -adds conference data received from the API to the app. 
function fill_conference_data(){
    $("#conference_image").attr("src","data:image/png;base64,"+loginObj['conf_image_data']);
    $("#conference_name").html(loginObj['conf_name']);
    $(".logo_center").html(loginObj['conf_name']);
    
    
    //Sham -unhide button and populate info - this needs to be removed if a template is implemented to allow multiple logins.
    //ids inside button
    $("#conf_name_login_1").html(loginObj['conf_name']);
    $("#email_login_1").html(loginObj['email']);
    //the button
    $("#conference_1").attr("style","");  
    
    
    $("#more_conference_info > p:nth-child(2)").html(loginObj['conf_desc']);
    loc = loginObj.conf_map_loc;
    //console.log(loc);
    loc = loc.replace("{lat: ", "");
    loc = loc.replace(" lng: ", "");
    loc = loc.replace("}", "");
}

//Sham -uses latest loginObj data to refresh or fill "My profile" page. 
function fill_profile_details(){
    $('#delegateUser_Profile').find('input[name="f_name"]').attr("placeholder", loginObj['first_name']);
    $('#delegateUser_Profile').find('input[name="s_name"]').attr("placeholder", loginObj['last_name']);
    $('#delegateUser_Profile').find('input[name="org"]').attr("placeholder", loginObj['organisation']);
    $('#delegateUser_Profile').find('input[name="role"]').attr("placeholder", loginObj['job_title']);
    $('#delegateUser_Profile').find('textarea[name="bio"]').attr("placeholder", loginObj['bio']);
    updateuserimagedisplay();
}


//Sends queue of messages to server if online, then drops table of queued messages.
//Sham- we need to try to change this back to DELETE FROM as if messages are added as this is running/sending then they may be dropped at the end.
//I think db->array then array->API then array->DELETE FROM will work, just not inside the first db transaction.
function FireMessgesToServer(db) {
                    var isOffline = 'onLine' in navigator && !navigator.onLine;
                    //console.log("online");
                    // PM - If there is an Internet connection then table values will be deleted and refreshed, 
                    //otherwise the local values will remain
                    if (! isOffline ){
                        //console.log("online");
                        db.transaction(function(transaction) {
                        transaction.executeSql('SELECT url FROM PendingMeetings;', 
                            [], function(transaction, result){
                                if (result != null && result.rows != null) {
                                    for (var i = 0; i < result.rows.length; i++) {
                                        var row = result.rows.item(i);
                                        var PendingMeeting = row.url;

                                        
                                        //console.log("Record no longer pending");
                                        //console.log("PendingMeeting");
                                        //console.log(PendingMeeting);
                
                                        logResp = $.ajax({
                                            url: PendingMeeting,
                                            async: false,
                                            type: "GET",
                                            dataType: "json"
                                            }).done(function(data) {
                                                //console.log(data.data);//PM - run the API to add the meeting
                                            });
                                    }
                                    
                                }
                            },errorHandler)
                        },errorHandler,nullHandler);//END database selection
                                                            //PM - meeting removed from pending meeting table if successfullyadded to online database
                        //Sham - didn't work so dropped table at end of online functions we might need to put .then on the above if this fires too early, or add it as a successcallback. I think it is a transaction within a transaction causing it not to work above.
                    db.transaction(function(tx) {tx.executeSql( 'Drop table PendingMeetings;' ,[],nullHandler,errorHandler);},errorHandler,successCallBack);
                    //console.log(" Pending Meeting Table Dropped")
                    lastupdate = Date.now();
                    }//END test isOffline
                }//FireMessgesToServer function end
        
//These are error handling functions that have been comented out for success - post-testing
function errorHandler(transaction, error) {
    //console.log('Error: ' + error.message + ' code: ' + error.code);
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
}






//Sham - need to call this when online state changes so it fixes the picture link to be active only when online
//Replaces elements of class .user_profile_form with one made from the currently db held loginObj.target_attendeeref data
//impacts delegatePerson_Profile, delegateReply_Meeting, delegateConfirmed_Meeting pages
function getattendee(){            
                loginObj_subset = pick(loginObj, ['apikey']);
                loginObj_subset.action = "getattendee";
                loginObj_subset.attendeeref = loginObj.target_attendeeref;
                var isOffline = 'onLine' in navigator && !navigator.onLine;
                if(loginObj_subset.attendeeref != ""){  
                        $AttendeeP = ""; //PM - reset the string variable to show the result
                        db.transaction(function(transaction){
                            transaction.executeSql('SELECT * FROM Attendees where reference = ? order by last_name, first_name;', 
                                [loginObj_subset.attendeeref], //PM - select the attendee details
                                function(transaction, result){
                                    if (result != null && result.rows != null) {
                                        for (var i = 0; i < result.rows.length; i++) {
                                            var row = result.rows.item(i);
                                            //console.log(row);
                                            //If offline or null then the placeholder gets used.
                                            if(!isOffline && row.profileimg_thumb!=null){
                                            $(".delegateProfilePic").attr("src","https://keele.bookmein2.com/images/profile/"+row.profileimg_thumb);
                                            } else {
                                            $(".delegateProfilePic").attr("src","profile_placeholder.jpeg");
                                            };
                                            $(".user_profile_form").find('input[name="f_name"]').attr("placeholder", row.first_name);
                                            $(".user_profile_form").find('input[name="s_name"]').attr("placeholder", row.last_name);
                                            $(".user_profile_form").find('input[name="org"]').attr("placeholder", row.organisation);
                                            $(".user_profile_form").find('input[name="role"]').attr("placeholder", row.job_title);
                                            $(".user_profile_form").find('textarea[name="bio"]').attr("placeholder", row.bio);
                                            };   
                                     };
                                       
                                }, errorHandler)
                        }, errorHandler, nullHandler)
                    }
}
                
   
//Sham -Updates all meeting and person data NOT CONF DATA.
//Changed getattendees to update the LoginObj now too.
//Timers to not overload the db or ddos the API - not particularly optimised at the moment.
function refreshall(){
    FireMessgesToServer(db);
    setTimeout(function() {
    ShowMeetings('All');
  }, 3000);
    setTimeout(function() {
    get_agenda();
  }, 3000);
    setTimeout(function() {
    get_attendees();
  }, 500);
    setTimeout(function(){
    fill_profile_details();    
  }, 1000);
    setlastupdatedtime();
}
    
    
//Sham - function to add a meeting to the database queue, which is then sent if online on the next call of FiremessgesToServer.
//Accepts GET requests.
function addPendingMeeting(logURL,MultipleUser){

        //PM - local pending meetings table added if not already there       
        db.transaction(function(tx){
            tx.executeSql('CREATE TABLE if not exists PendingMeetings (url nvarchar(300) not null, userID nvarchar(100) not null)',
                [], nullHandler, errorHandler);
        }, errorHandler, successCallBack);
        //console.log("Table Created");

        //PM - New meeting values added to the local database
        db.transaction(function(tx){
            tx.executeSql( 'INSERT Into PendingMeetings Values (?,?)',
                [logURL, 
                MultipleUser],
                nullHandler, errorHandler)
        }, errorHandler, successCallBack);
        //console.log("Pending Meetings added");
        refreshall();
}




