/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
// Source the sample points of interest
// Load the current point collection; filter out points with null data
var collToSample = Pro_fungi_Points;
print('Sample Points',collToSample);
print('Size of Sample Collection',collToSample.size());
Map.addLayer(collToSample,{},'Points being sampled',false);

// Clean the data
var Pro_fungi_Points_new = collToSample.filterMetadata('Fun_pro','not_equals','NA').select('Fun_pro')

/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
// Gap fill and extend bounds to sample points falling outside of land masses
// Doing so "snaps" points that fall outside the pixel grid to the nearest
// pixel (e.g., points that are taken near the ocean may slightly fall off
// the pixel grid; this function corrects these points)

print('Composite Bands',compositeOfInterest); // this is to print the composite (n = 90; see Supplementary Table 1)

// Define the list of bands to fill / extend
var listOfBandsToFill = [
'Pixel_Long',
'Pixel_Lat'
];

// Load the function from the shared repository
var gapFillAndExtendBounds = require('users/ky9hc/tool:GapFillAndExtendBounds.js');
var filledImage = gapFillAndExtendBounds.gapFillAndExtendBounds(compositeOfInterest.select(listOfBandsToFill),listOfBandsToFill,10000);
 print('Filled Image', filledImage);

/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
// Sample all points within 10 pixels of the grid then aggregate them
// to assets

var aggregatePath = require('users/ky9hc/tool:Aggregate_Points.js');

// The code below allows for sampling the collection without dropping missing values
var samplesForAggregation_bFR = filledImage.sampleRegions({
	collection: Pro_fungi_Points_new,
	scale: compositeOfInterest.projection().nominalScale().getInfo()
});
print('Sampled Points for Aggregation - Pro Fungal',samplesForAggregation_bFR.limit(5));
Map.addLayer(samplesForAggregation_bFR,{},'Sampled Points for Aggregation',false);


// Perform the aggregation
var propToAgg_bFR = 'Fun_pro';
var finalPointsAggregated_bFR = aggregatePath.aggregatePointsIntoPixels(samplesForAggregation_bFR,
                                                                      propToAgg_bFR,
                                                                      'mean',
                                                                      'Pixel_Lat',
                                                                      'Pixel_Long');
Map.addLayer(finalPointsAggregated_bFR,{},'finalPointsAggregated',false);                                                                 

// The code below allows for the export of the sampled points

Export.table.toAsset({
	collection: finalPointsAggregated_bFR,
	description:'Samples_Aggregated_Fun_pro_all_rev6',
	assetId: 'users/ky9hc/Fun_pro_final/Samples_Aggregated_Fun_pro_all_rev6',
});
