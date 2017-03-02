//importing modules
var express = require( 'express' );
var request = require( 'request' );
var cheerio = require( 'cheerio' );

//creating a new express server
var app = express();

//setting EJS as the templating engine
app.set( 'view engine', 'ejs' );

//setting the 'assets' directory as our static assets dir (css, js, img, etc...)
app.use( '/assets', express.static( 'assets' ) );


//makes the server respond to the '/' route and serving the 'home.ejs' template in the 'views' directory
app.get('/process', function(req,res) {
	const url=req.query.lbcUrl;

	if(url) {
		get(url, res, getMAEstimation)
	}
	else {
		res.render('pages/index', {
			error: 'Url is empty'
		})
	}
});

//launch the server on the 3000 port
app.listen( 3000, function () {
    console.log( 'App listening on port 3000!' );
});

function getLBCData( lbcUrl, routeResponse, callback){
	request(lbcUrl, function(error,response,html)
	{
		if(!error) {
			let $ = cheerio.load(html); //Module pour parser le document html

			const lbcData = parseLBCData(html) 

			if (lbcData) {
				console.log('LBC Data:', lbcData)//Affiche dans la console
				callback(lbcData, routeResponse)
			}
			else {
				routeResponse.render('pages/index', {
					error:'No data found'
				});
			}
		}
		else {
			routeResponse.render('pages/index', {
				error: 'Error loading the given URL'
			});
		}
	});
}

function parseLBCData(html) {
	const $ = cheerio.load(html)

	const lbcDataArray = $ ('section.properties span.value')
	//toutes les valeurs des noeuds span fils de section.properties
	//stocke dans un tableau
	//récupérer les données à partir du tableau
	const lbcDataArray2 = $ ('section.properties span.propery')
	var type;
	var surf;

	for (var i = 0; i< $(lbcDataArray2).length;i++){
		if($(lbcDataArray2).get(i).text()=== 'Type de bien'){
			type= $(lbcDataArray.get(i)).text()
		}

		if($(lbcDataArray2.get(i)).text() === 'Surface'){
			surf = $(lbcDataArray.get(i)).text()
		}
	}

	return lbcData = {
		price: parseInt($(lbcDataArray.get(0))
			.text().replace(/\s/g,''), 10),
		city: $(lbcDataArray.get(1))
		.text().trim().toLowerCase()
		.replace(/\_|\s/g, '-').replace(/\-\d+/, ''),
		postalCode: $(lbcDataArray.get(1))
		.text().trim().toLowerCase().replace(/\D|\-/g,''),
		type: $(lbcDataArray.get(2))
		.text().trim().toLowerCase(),
		surface: parseInt($(lbcDataArray.get(4))
		.text().replace(/\s/g,''), 10 )
	}

	else{
		routeResponse.render('pages/index',{
			error:'No data found'
		});


	}
	else{
		routeResponse.render('pages/index',{

		});
	}
}

function getMAEstimation(lbcData, routeResponse) {
	if (lbcData.city
		&& lbcData.postalCode
		&& lbcData.surface
		&& lbcData.price) {
		// Instancie les paramètres avec les valeurs de lbcData pour city et postalCode
		const url = 'https://www.meilleursagents.com/prix-immobilier/{city}-{postalCode}/'
		.replace('{city}', lbcData.city.replace(/\_/g, '-')).replace('{postalCode}', lbcData.postalCode);

		console.log('MA URL:', url);

		request(url, function(error, response, html){

			if( ! error){
				let $ = cheerio.load(html);

				if($ ('meta[name=description]').get().length === 1 && $('meta[name=description]').get()[0].attribs && $('meta[name=description]').get()[0].attribs.content)

				console.log($('meta[name=description]').get());

				console.log($('meta[name=description]').get()[0].attribs)

				console.log($('meta[name=description]').get()[0].attribs.content)

				var maData = parseMAData.priceAppart(html)

				// Selection du type

				if(lbcData.type==='appartement'){
					var ref = maData.priceAppart;
				}
				else{
					var ref = maData.priceHouse;
				}

				if(maData.priceAppart && maData.priceHouse)
				{
					routeResponse.render('pages/index',
						message : {
							lbcData,ref,deal:{good: isGoodDeal(lbcData,ref)}
						})
				}

				else{
					console.log('erreur lors du scrapping de MA')
				}

				/*if($('meta[name=description]').get().length===1
					&& $('meta[name=description]').get()[0].attribs
					&& $('meta[name=description]').get()[0].attribs.content)*/
			}
		}
		

	}
}

function isGoodDeal (lbcData, maData) {

	const adPricePerSqm = Math.round(lbcData.price/lbcData.surface)

	var conclu;
	if(maData>adPricePerSqm){
		conclu = "C'est une bonne affaire car le prix est" + Math.sign((adPricePerSqm - maData)/maData) + "% en dessous du marché"
	}
	else{
		conclu = "Ce n'est pas une bonne affaire car le prix est " + Math.sign((adPricePerSqm - maData)/maData) + "% trop élevé"
	}

	return conclu;
}

	/*const maPrice = lbcData.type === 'appartement' ? maData.priceAppart : maData.priceHouse

	return adPricePerSqm < maPrice
}*/

function parseMAData(html) {

	const priceAppartRegex = /\bappartement\b :(\d+) €/mi
	const priceHouseRegex= /\bmaison\b : (\d+) €/mi

	if (html) {
		const priceAppart= priceAppartRegex.exec(html)
		&& priceAppartRegex.exec(html).length
		=== 2 ? priceAppartRegex.exec(html)[1]:0

		const priceHouse = priceHouseRegex.exec(html)
		&& priceAppartRegex.exec(html).length
		=== 2 ? priceHouseRegex.exec(html)[1] : 0
	}

	return maData = {
		priceAppart, priceHouse
	}
}