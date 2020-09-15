// Print info on the sampled points
print(sampledPro_funPoints);
Map.addLayer(sampledPro_funPoints,{},'Sample Points',false);

// Instantiate a (client-side) list (server-side) classifiers of interest for cross validation
var rfVPS2 = ee.Classifier.randomForest({
	numberOfTrees: 500,
	variablesPerSplit: 2,
	bagFraction: 0.632,
	seed: 0
}).setOutputMode('REGRESSION');

var rfVPS3 = ee.Classifier.randomForest({
	numberOfTrees: 500,
	variablesPerSplit: 3,
	bagFraction: 0.632,
	seed: 0
}).setOutputMode('REGRESSION');

var rfVPS4 = ee.Classifier.randomForest({
	numberOfTrees: 500,
	variablesPerSplit: 4,
	bagFraction: 0.632,
	seed: 0
}).setOutputMode('REGRESSION');

var rfVPS5 = ee.Classifier.randomForest({
	numberOfTrees: 500,
	variablesPerSplit: 5,
	bagFraction: 0.632,
	seed: 0
}).setOutputMode('REGRESSION');

var rfVPS8 = ee.Classifier.randomForest({
	numberOfTrees: 500,
	variablesPerSplit: 8,
	bagFraction: 0.632,
	seed: 0
}).setOutputMode('REGRESSION');

var rfVPS10 = ee.Classifier.randomForest({
	numberOfTrees: 500,
	variablesPerSplit: 10,
	bagFraction: 0.632,
	seed: 0
}).setOutputMode('REGRESSION');

// Kai: why only change variablesPerSpli?
// Kai: why not use gmoLinearRegression which was used in old version of code?
// Kai: question: what ee.Kernel.square used for; which is used in old version of code? 

var listOfModels = [
	rfVPS2,
	rfVPS3,
	rfVPS4,
	rfVPS5,
	rfVPS8,
	rfVPS10
];

// Instantiate a list of names for each of the models
var listOfModelNames = [
	'rfVPS2_fun_pro_all_rev6',
	'rfVPS3_fun_pro_all_rev6',
	'rfVPS4_fun_pro_all_rev6',
	'rfVPS5_fun_pro_all_rev6',
	'rfVPS8_fun_pro_all_rev6',
	'rfVPS10_fun_pro_all_rev6'
];

// Instantiate a client side list of numbers, each representing the model
// that is being cross validated (starting at 0)
var listToMap = [0, 1, 2, 3, 4, 5];

// Make a list of covariates to use; thus, this essentially remove bands of Pixel_Long,Pixel_Lat,Abs_Lat
var covarsToUse = sampledPro_funPoints.first().propertyNames().removeAll([
	'Fun_pro',
	'system:index',
	'Pixel_Long',
	'Pixel_Lat',
	'Abs_Lat',
]);
print('Covariates being used', covarsToUse);

// Identify the covariate of interest for all feature collections being modeled
var modelledVariable_FungPro = 'Fun_pro';


// Instantiate the names of the recpipient folder to hold all of the outputs for all feature collections being modeled
var nameOfFolder_FungPro = 'users/ky9hc/ratio_final_revison';


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Perform K-Fold CV on the model to assess its rigor
var KFoldCVwManualFC = require('users/ky9hc/tool:KFoldCVManualFC.js');

var k = 10; //Thus, this is to use 10-Fold cross validation

// Map through all of the models being assessed and export their
// CV results as Earth Engine assets
// Make this into a function for easier use
var exportCVResultsToAsset = function(featureCollectionBeingUsed, variableBeingModelled, covarsToUse, parentFolder) {
	listToMap.map(function(mN) {

		// Get the classifier from the list
		var classifierToUse = listOfModels[mN];

		// Perform the cross validation on the dataset
		var kFoldCVResults = KFoldCVwManualFC.KFoldCVwManualFC(featureCollectionBeingUsed, k, classifierToUse, variableBeingModelled, covarsToUse);

		// Derive a name for the export
		var nameOfExport = listOfModelNames[mN];

		// Export the results to assets
		Export.table.toAsset({
			collection: kFoldCVResults,
			description: nameOfExport,
			assetId: parentFolder + '/' + nameOfExport
		});

	});
};

// Export the results
exportCVResultsToAsset(sampledPro_funPoints,
	modelledVariable_FungPro,
	covarsToUse,
	nameOfFolder_FungPro);


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Assess the models using k-fold Cross validation

// Make a function to retrieve the R2 values of the CV outputs
// and add a map of residuals, showing points that are not accurately
// modeled
var reportCVR2 = function(folderName, modelledVariableName) {

	// Load the Compute R2 function
	var computeR2 = require('users/ky9hc/tool:Compute_R2_from_CV.js');

	// Map through the outputted feature collections and compute the R2 values for each one
	var r2Results = ee.FeatureCollection(listOfModelNames.map(function(modelName) {
		// Instantiate each of the outputted feature collections
		var fCOfResults = ee.FeatureCollection(folderName + '/' + modelName);
		
		// Run the Compute R2 function on each feature collection
		var finalR2 = computeR2.computeR2FromCVFC(fCOfResults, modelledVariableName, 'PredictedValue', 'FoldNumber');
		
		// Compute the absolute value residuals for each feature from the feature collection and add
		// it to the feature as a property
		var residualsFC = fCOfResults.map(function(f) {
			return f.set('AbsResidual', ee.Number(f.get('PredictedValue'))
			                            .subtract(f.get(modelledVariableName)).abs());
		});
		
		// Add the model name to each dictionary, then make each dictionary a feature (for sorting)
		var finalFeature = ee.Feature(null).set(ee.Dictionary(finalR2).set('ModelName', modelName))
		                                   .set('ResidualsFC',residualsFC);
		                                   
		return finalFeature;
	}));


	// Print all of the values, sorted by mean R2; then, print the top model name and values
	print('All R2 Results', r2Results.sort('mean', false));
	print('Top Model Name', ee.Feature(r2Results.sort('mean', false).toList(1).get(0)).get('ModelName'));
	print('Top Model Mean R^2', ee.Feature(r2Results.sort('mean', false).toList(1).get(0)).get('mean'));
	print('Top Model R^2 StdDev', ee.Feature(r2Results.sort('mean', false).toList(1).get(0)).get('stdDev'));

	
	return r2Results.sort('mean', false);
};


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Review the results and, optionally, create new feature collections for futher modelling
// using the outputs of the cross validation function

// Make a color ramp for the residuals maps
var vibgYOR = ['330044', '220066', '1133cc', '33dd00', 'ffda21', 'ff6622', 'd10000'];

// Call the function and display a map of residuals
print('Fungal Pro Ratio Results');
var cvResults_FungPro = reportCVR2(nameOfFolder_FungPro, modelledVariable_FungPro);
var residualsFC_FungPro = ee.FeatureCollection(ee.Feature(cvResults_FungPro.toList(1).get(0)).get('ResidualsFC')).sort('AbsResidual',false);
print('Residuals FC Rh',residualsFC_FungPro);
// print('Largest Absolute Residual - BFR',residualsFC_FungPro.reduceColumns('max',['AbsResidual']))
var residualsImage_FungPro = ee.Image().float().paint(residualsFC_FungPro, 'AbsResidual').focal_mean(5);
Map.addLayer(residualsImage_FungPro, {min: 0, max: 50, palette: vibgYOR}, 'Fungal Pro CV residuals');

// Take the top X number of points (according to the magnitude of the absolute residuals) then
// remove them from the original collection
var outliersToRemove_FungPro = ee.FeatureCollection(residualsFC_FungPro.limit(5));
print('Outliers to Remove',outliersToRemove_FungPro);
var outliersRemovedCollection_FungPro = ee.Join.inverted().apply(
  sampledPro_funPoints,
  outliersToRemove_FungPro,
  ee.Filter.intersects('.geo', null, '.geo'));
print('Collection with Outliers Removed - Fungal Pro Ratio',outliersRemovedCollection_FungPro);
var residualsImage_FungPro_Outliers = ee.Image().float().paint(outliersToRemove_FungPro, 'AbsResidual').focal_mean(5);
Map.addLayer(residualsImage_FungPro_Outliers, {min: 0, max: 50, palette: vibgYOR}, 'Outliers being removed');

Export.table.toAsset({
  collection: outliersRemovedCollection_FungPro,
  description:'Samples_Out_removed_fun_pro_all_rev6',
  assetId:'users/ky9hc/Fun_pro_final/Samples_Out_removed_fun_pro_all_rev6'
});

