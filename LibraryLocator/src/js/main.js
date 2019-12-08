// Geting current latitude and longitude using JavaScript's navigator.geolocation.getCurrentPosition() function
// This function returns an object called position that contains within it the user's latitude and longitude
navigator.geolocation.getCurrentPosition(function (position) {
    // storing latitude and longitude from the position object into variables
    let current_lat = position.coords.latitude;
    let current_long = position.coords.longitude;

    // Setting the map location to user's latitude and longitude calculated in previous step
    var map = L.map("map").setView([current_lat, current_long], 13);

    L.tileLayer(
        "https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
            maxZoom: 18,
            id: "mapbox.streets",
            accessToken: "pk.eyJ1IjoiemFpbm1hbm5hbiIsImEiOiJjazM2aHJnYXcwMXdmM2VudjIzbmNpdW92In0.GCXNd7NlLt-CsXk1KFb0Qg"
        }
    ).addTo(map);

    // Adding marker on your current location
    let current_location_marker = L.marker([current_lat, current_long]);
    current_location_marker.addTo(map);
    current_location_marker
        .bindTooltip("You are here", {
            permanent: true
        })
        .openTooltip();

    // Adding circle around current location, 3218.69 meters (2 miles) radius
    // Uncomment this code if you don't want circle
    var circle = L.circle([current_lat, current_long], {
        color: "green",
        fillColor: "#00FF00",
        fillOpacity: 0.1,
        radius: 3218.69
    }).addTo(map);

    // Fetching from PG Library API
    fetch(
            "https://data.princegeorgescountymd.gov/resource/7k64-tdwr.json"
        )
        .then(response => response.json()) // Converting fetch response to json
        .then(list_of_libraries => {
            $.getJSON("js/branch_names.json", function (valid_branch_name) {
                // Each item in branch_names json is an object with two fields, branch_name and url
                // We have to make a new list with just the branch_names from each item
                let list_of_branch_names = valid_branch_name.map(
                    each_item => each_item.branch_name
                );

                console.log("Number of branches", valid_branch_name.length);
                // Looping through the list of libraries
                list_of_libraries.forEach(library_object => {
                    // if the branch name we got from the item is in the list_of_branch_names we created in line 88
                    if (
                        list_of_branch_names.includes(library_object.branch_name)
                    ) {
                        // getting library information from each library object
                        let library_lat = library_object.location_1.latitude;
                        let library_long = library_object.location_1.longitude;
                        let branch_name = library_object.branch_name;

                        // Get the url from the item in branch_names.json whose name is equal to the name of the branch we got from API
                        let branch_url = valid_branch_name.filter(
                            each_item => each_item.branch_name == branch_name
                        )[0].url;
                        let address = library_object.location_1.human_address;
                        let telephone = library_object.telephone;

                        // human_address from library API holds a string, so
                        // converting address into JSON
                        let address_json = JSON.parse(address);

                        // splitting address into street, city and zipcode
                        let street = address_json.address.split(",")[0];
                        let state = address_json.state;
                        let zip = address_json.zip;

                        // putting address together
                        let full_address = street + ", " + state + " " + zip;

                        // Adding marker at lat and long of each library object to map
                        let marker = L.marker([library_lat, library_long]);

                        marker.addTo(map);

                        // putting together branch name, address and phone number as html
                        let label_html =
                            '<br><a href= " ' +
                            branch_url +
                            ' " target="_blank">' +
                            branch_name +
                            "</a><br>" +
                            full_address +
                            "<br>Phone: " +
                            telephone +
                            "<br>";
                        // console.log(label_html)
                        // Opening services_dictionary.json to check the list of services for library branch
                        $.getJSON("js/services_dictionary.json", function (
                            library_services_json
                        ) {
                            // Initializing HTML text for services as null
                            // This HTML is going to be appeneded to the label_html created in Line 162
                            services_html = "";

                            // For each item in list found in services_dictionary.json
                            library_services_json.forEach(each_branch_services => {
                                // If the branch name of the list item equal to the branch name of the current map marker
                                if (each_branch_services.branch_name == branch_name) {
                                    // Create HTML text
                                    // The text looks something like this
                                    /*
                                                                    Services:
                                                                        . some_service_1
                                                                        . some_service_2
                                                                        . some_service_3
                                                                */

                                    services_html += "Services:";
                                    services_html += "<ul>";
                                    each_branch_services.services.forEach(service => {
                                        services_html +=
                                            "<li>" +
                                            "<a href=" +
                                            '"' +
                                            service.url +
                                            '" target="_blank">' +
                                            service.name +
                                            "</a>" +
                                            "</li>";
                                    });
                                    services_html += "</ul>";
                                }
                            });

                            // If the branch name of the current map marker was not found in services_dictionary.json
                            // Set the HTML text as Services: Coming Soon
                            if (services_html == "") {
                                services_html = "Services: Coming Soon!";
                            }

                            // Add the full HTML text with branch name, address, phone number and list of services
                            // to the Popup that appears when you click the marker
                            marker.bindPopup(label_html + services_html);
                        });
                        // adding label to each marker as popup. Marker has to be clicked to reveal label

                        // If you want the label to be permenantly visible on the map, add this code instead of the previous one
                        // marker.bindTooltip(library.branch_name, {permanent: true}).openTooltip();
                    }
                });
            });
        });
});