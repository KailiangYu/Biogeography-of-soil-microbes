// Print information on the sampled points
print('Fungal Pro Points',sampledFungproPoints);
Map.addLayer(sampledFungproPoints,{},'Fungal Pro Points',false);

// Step 3 show the top model; thus here we used top model in generating final map
// Instantiate classifiers of interest
var randomForestClassifier_sampledBBRPoints = ee.Classifier.randomForest({
	numberOfTrees: 500,
	variablesPerSplit: 8,
	bagFraction: 0.632,
	seed: 100
}).setOutputMode('REGRESSION');


// Make a list of covariates to use
var covarsToUse_Current = sampledFungproPoints.first().propertyNames().removeAll([
	'system:index',
	'Pixel_Long',
	'Pixel_Lat',
	'Fun_pro'
]);
print('Covariates being used - Current Maps', covarsToUse_Current);


// Train the classifers with the sampled points
var trainedClassifier_sampledFungproPoints = randomForestClassifier_sampledBBRPoints.train({
  features:sampledFungproPoints,
  classProperty:'Fun_pro',
  inputProperties:covarsToUse_Current
});


// Apply the classifier to the composite to make the final map

var newImageBandName = 'Fungi_propotion';
var finalMap = compositeOfInterest.classify(trainedClassifier_sampledFungproPoints,newImageBandName).updateMask(compositeOfInter.select('Abs_Lat').add(1000));


print(finalMap,'finalMap')

// map and visualize
var vibgYOR = ['330044','220066','1133cc','33dd00','ffda21','ff6622','d10000'];
print ('finalMap',finalMap)
Map.addLayer(finalMap,{palette:vibgYOR,min:0.05,max:0.3},'Map of Propotion of Fungal');


// Create an unbounded geometry for exports
var unboundedGeo = ee.Geometry.Polygon([-180, 88, 0, 88, 180, 88, 180, -88, 0, -88, -180, -88], null, false);

// Export the maps to Assets
Export.image.toAsset({
	image: finalMap,
	description: 'Fungal_pro_all_rev6',
	assetId: 'users/ky9hc/Fun_pro_final/Fungal_pro_all_rev6',
	region: unboundedGeo,
  crs:'EPSG:4326',
  crsTransform:[0.008333333333333333,0,-180,0,-0.008333333333333333,90],
	maxPixels: 1e13
});

// Kai: Export the maps to driver and then plot in R and analyze 
Export.image.toDrive({
	image: finalMap,
	description: 'Fungal_pro_all_rev6_Drive',
	region: unboundedGeo,
  crs:'EPSG:4326',
  crsTransform:[0.008333333333333333,0,-180,0,-0.008333333333333333,90],
	maxPixels: 1e13
});


