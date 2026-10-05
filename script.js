fetch('unload.php')
    .then(response => response.json())
    .then(daten => {

        console.log(daten);

    });