   // Variable to hold the popup instance
   let popup = null;
        
   // GeoJSON data object to store the contributed points
   let geojson = {
       'type': 'FeatureCollection',
       'features': []
   };
   
   // Create a new map instance
   let map = new maplibregl.Map({
       container: 'map', // container id
       style: 'https://api.maptiler.com/maps/streets-v2/style.json?key=Cusoe5zmfmn26glFoeoe', // style URL
       center: [-122.8950075, 47.0451022], // starting position [lng, lat]
       // pitch: 45, // pitch in degrees
       zoom: 12// starting zoom
   });

   // Fetch existing records when the window is loaded
   window.addEventListener("load", async function () {
       let response = await fetch('https://pmap-28a9a9408e2b.herokuapp.com/api/get-record', {
           method: 'GET'
       });

       let data = await response.json();
 
       // Iterate through the fetched records and add them to the GeoJSON data object
       for (let i = 0; i < data.rows.length; i++) {
           geojson.features.push({
               'type': 'Feature',
               'properties': {
                   'contributor': data.rows[i].contributor,
                   'content': data.rows[i].content,
               },
               'geometry': {
                   'type': 'Point',
                   'coordinates': [data.rows[i].lng, data.rows[i].lat]
               }
           });
       }
   });

   // After the map loads, add the GeoJSON source and layer for existing points
   map.on("load", function () {
       map.addSource('places', {
           'type': 'geojson',
           'data': geojson
       });

       map.addLayer({
           'id': 'placesLayer',
           'type': 'circle',
           'source': 'places',
           'paint': {
               'circle-radius': 6,
               'circle-color': 'red'
           }
       });
   });

   // Show popup on mouse enter over an existing point
   map.on('mouseenter', 'placesLayer', function (e) {
       map.getCanvas().style.cursor = 'pointer';

       var coordinates = e.features[0].geometry.coordinates;
       var content = e.features[0].properties.content;
       var Email = e.features[0].properties.Email;
       console.log(Email)
       var contributor = e.features[0].properties.contributor;

       popup = new maplibregl.Popup()
           .setLngLat(coordinates)
           .setHTML("<p><b>" + contributor + "</b> <i>said:</i> " + content + "</p>" + "\n" + Email)
           .addTo(map);
   });

   // Remove popup on mouse leave from an existing point
   map.on('mouseleave', 'placesLayer', function () {
       map.getCanvas().style.cursor = '';
       popup.remove();
   });

   // Handle click event on the map to allow user contribution
   map.on('click', function (e) {
       if (popup) {
           popup.remove();
       }

       // Create the HTML content for the contribution popup
       const popupContent = '<div id="popup"><input type="text" id="name" placeholder="Input your name here..."><input type="text" id="content" placeholder="Input your message here..."><input type="text" id="EmailInput" placeholder="Input your Email" /><button id="submit">submit</button></div>';

       // Create a new popup and set its content
       popup = new maplibregl.Popup({ closeOnClick: false })
           .setLngLat(e.lngLat)
           .setHTML(popupContent)
           .addTo(map);

       // Attach an event listener to the submit button to handle new record submission
       document.getElementById('submit').addEventListener('click', submitNewRecord);
       e.preventDefault();
   });

   // Function to handle the submission of a new record
   async function submitNewRecord() {
       let contributor = document.getElementById('name').value;
       let content = document.getElementById('content').value;
       let Email = document.getElementById("EmailInput").value;
       let lngLat = popup.getLngLat();

       // Create a new URLSearchParams object and append the data to it
       let newRecord = new URLSearchParams();
       newRecord.append('contributor', contributor);
       newRecord.append('content', content);
       newRecord.append("Email",Email)
       newRecord.append('lng', lngLat.lng);
       newRecord.append('lat', lngLat.lat);

       // Set the POST request settings
       let settings = {
           method: 'POST',
           body: newRecord
       }

       try {
           // Send the POST request to add the new record
           await fetch('https://pmap-28a9a9408e2b.herokuapp.com/api/add-record', settings);
       } catch (err) {
           // Handle any errors that occur during the request
           console.error(err);
       } finally {
           // Remove the popup and update the GeoJSON data with the new point
           popup.remove();
           geojson.features.push({
               'type': 'Feature',
               'properties': {
                   'contributor': contributor,
                   'content': content,
                   "Email":Email
               },
               'geometry': {
                   'type': 'Point',
                   'coordinates': [lngLat.lng, lngLat.lat]
               }
           });
           map.getSource('places').setData(geojson);
       }
   }