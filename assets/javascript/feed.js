$(function() {
    //For responsive navbar
    $(".dropdown-button").dropdown({hover: false});
    $(".button-collapse").sideNav();
    
    //get the current user from session
    //get the current user from session 
    /*var userSessionEntity = {
        "email": "someuser"
    };*/
    var userSessionEntity = JSON.parse(sessionStorage.getItem("userSessionEntity"));
    console.log("In onload on feed.js");

    //get all events from database
    async function loadAllCliques() {
        console.log("In function loadAllCliques");

        var crammingCliques = await getAllCliques();
        //prepopulate all feed data pulled from the table

        crammingCliques.forEach(async function(clique) {

            var attending = false;
            var attendingCount = 1; //1 becuase the host will attend
            if (clique.attendees !== null && clique.attendees !== undefined) {
                var attendeesList = Object.keys(clique.attendees).map(function(key) {
                    return clique.attendees[key];
                });


                attendeesList.forEach(function(attendee) {
                    attendingCount++;
                    if (userSessionEntity.email === attendee.attendee) {
                        attending = true;
                    }
                });
            }
            //build clique card
            var cardTitle = $("<span>").addClass("card-title").attr("id","cliqueCardTitle").text(clique.title);
            var cardModalButton = $("<a>").addClass("btn-floating halfway-fab waves-effect waves-light red").attr("data-toggle","modal").attr("data-target","#modal" + clique.id);
            cardModalButton.append("<i class='material-icons'>add</i>");

            var cliqueDate = $("<p>").attr("id","cliqueCardDate").text(clique.date);
            var cliqueAttendingCount = $("<p>").attr("id","cliqueCardAttending").text(attendingCount + " Crammers attending..");

            var cardHeader = $("<div>").addClass("card-header");
            cardHeader.append(cliqueDate);
            cardHeader.append(cardModalButton);


            var cardContent = $("<div>").addClass("card-content");
            cardContent.append(cardTitle);
            cardContent.append(cliqueAttendingCount);
           
            var cardClique = $("<div>").addClass("card horizontal").attr("id","cliqueCard");
            cardClique.append(cardHeader);
            cardClique.append(cardContent);
            $("#divCliques").append(cardClique);


            //build clique modal
            var cliqueHost = await getUserDetailsByEmail(clique.host);

            var divModalHeader = $("<div>").addClass("modal-header");
            var pModalUser = $("<p>");
            var imgHost = $("<img>").addClass("rounded-circle").attr("src", cliqueHost[0].imageUrl).attr("width","50").attr("height","50");
            pModalUser.append(imgHost);
            pModalUser.append($("<span>").html(" Organizer: "+ cliqueHost[0].name));
            divModalHeader.append(pModalUser);
            var btnCliqueModalClose = $("<button>").addClass("close");
            btnCliqueModalClose.attr("type", "button");
            btnCliqueModalClose.attr("data-dismiss", "modal");
            btnCliqueModalClose.attr("aria-label", "Close");
            btnCliqueModalClose.append($("<span>").attr("aria-hidden", "true").text("x"));
            divModalHeader.append(btnCliqueModalClose);


            var divModalBody = $("<div>").addClass("modal-body");
            divModalBody.append($("<p>").text("Date & Time: " + clique.date + " at " + clique.time));
            divModalBody.append($("<p>").text("Location: " + clique.where));
            divModalBody.append($("<p>").text("Description: " + clique.description));


            //for events for which user is the owner, have manage button
            var divModalFooter = $("<div>").addClass("modal-footer");
            if (userSessionEntity.email === clique.host) {
                var btnCliqueManage = $("<button>").addClass("btn btn-secondary").attr("id", "cliqueManage").attr("data-info",clique.id).text("Manage");
                divModalFooter.append(btnCliqueManage);

            } else {
                //for events for which user is not attending, have the register button
                //for events for which user is already attending, have the derister button
                if (attending === true) {
                    var btnCliqueManage = $("<button>").addClass("btn btn-secondary").attr("id", "cliqueDeRegister").attr("data-info",clique.id).text("De-register");
                    divModalFooter.append(btnCliqueManage);

                } else {
                    var btnCliqueManage = $("<button>").addClass("btn btn-secondary").attr("id", "cliqueRegister").attr("data-info",clique.id).text("Register");
                    divModalFooter.append(btnCliqueManage);

                }
            }

            var divModalContent = $("<div>").addClass("modal-content");
            divModalContent.append(divModalHeader);
            divModalContent.append(divModalBody);
            divModalContent.append(divModalFooter);

            var divModalDialog = $("<div>").addClass("modal-dialog modal-dialog-centered").attr("role", "document");
            divModalDialog.append(divModalContent);

            var divCliqueModal = $("<div>").addClass("modal fade").attr("id", "modal" + clique.id);
            divCliqueModal.attr("tabindex", "-1");
            divCliqueModal.attr("role", "dialog");
            divCliqueModal.attr("aria-labelledby", "exampleModalCenterTitle");
            divCliqueModal.attr("aria-hidden", "true");
            divCliqueModal.append(divModalDialog);

            $("#divCliques").append(divCliqueModal);

        });
    };
    loadAllCliques();

    //setup the click event handler on register button
    //validate again to make sure user us not already marked to register
    //update database table with users attending the event info
    //remove the register button and replace it with deregister button
    $(document).on("click", "#cliqueRegister", async function(event) {
        console.log("In function #cliqueRegister");

        var cliqueId = $(this).attr("data-info");
        await registerCliques(cliqueId, userSessionEntity.email);
        var cliqueDetails = await getCliqueDetails(cliqueId);
        var cliqueHostDetails = await getUserDetailsByEmail(cliqueDetails[0].host);
        if(cliqueHostDetails[0].receiveTextNotification && cliqueHostDetails[0].phone !== null && cliqueHostDetails[0].phone !== undefined){
            mobileNotifyHost(cliqueHostDetails[0].phone,"Cramming user "+userSessionEntity.email+ " will be joining your clique titled "+cliqueDetails[0].title);    
        }
        
        $(this).text("De-Register");
        $(this).attr("id", "cliqueDeRegister");
    });


    //setup the click event handler on deregister button
    //validate again to make sure user is already marked as register
    //update database table by removing the users attending the event info
    //remove the deregister button and replace it with register button
    $(document).on("click", "#cliqueDeRegister", async function(event) {
        console.log("In function #cliqueDeRegister");

        var cliqueId = $(this).attr("data-info");
        await deregisterCliques(cliqueId, userSessionEntity.email);
        $(this).text("Register");
        $(this).attr("id", "cliqueRegister");

    });


    //have a database event handler for new events
    //add a new event dynamically to the page

    //have a database event handler for register/deregister events
    //add or remove attendees dynamically to the page

});