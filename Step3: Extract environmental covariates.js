// Source the aggregated point
// Load the current point collection
var collToSample = Pro_FungalPointsAggregated;
print('Sample Points',collToSample.limit(5));
print('Size of Sample Collection',collToSample.size());
Map.addLayer(collToSample,{},"Points being sampled");


/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
// Gap fill and extend bounds to sample points falling outside of land masses
// This is the same function used in the "PSoilCarbon_Sample_Composite_for_Aggregation.js"
// script, and allows points falling in pixel gaps to sample the nearest
// pixel value rather than being dropped in the analysis due to a missing/NA
// value; per the function input below, the range of this "gap filling" is
// 10000 meters (or 10 pixels)

 print('Original Composite Bands',compositeOfInterest);

// Define the list of bands to fill / extend;

var listOfBandsToFill = compositeOfInterest.bandNames();

print('All band names',listOfBandsToFill);

// Load the function from the shared repository
var gapFillAndExtendBounds = require('users/ky9hc/tool:GapFillAndExtendBounds.js');

// Gap fill the image of interest
var filledImage = gapFillAndExtendBounds.gapFillAndExtendBounds(compositeOfInterestBandsAdded.select(listOfBandsToFill),listOfBandsToFill,10000);
// print('Filled Image', filledImage);
// Map.addLayer(filledImage,{},'Filled Image',false);


// The code below allows for sampling the collection with dropping missing values
var samplesForTrainingWithoutMissing = filledImage.sampleRegions({
	collection: collToSample,
	scale: compositeOfInterestBandsAdded.projection().nominalScale().getInfo(),
	tileScale:16,
	geometries:true
});
print('Sampled Points without Missing Values',samplesForTrainingWithoutMissing);


// The code below allows for the export of the sampled points (without missing values)
Export.table.toAsset({
	collection: samplesForTrainingWithoutMissing,
	description:'SampleValues_nullsDropped_fun_pro_all_rev6',
	assetId:'users/ky9hc/Fun_pro_final/SampleValues_nullsDropped_fun_pro_all_rev6'
});
