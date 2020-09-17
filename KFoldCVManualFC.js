exports.KFoldCVwManualFC = function(inputtedFeatureCollection, k, classifierOfChoice, propertyToPredictAsString, propertiesUsedInPrediction) {
/*
This version of the cross validation script takes a sampled feature collection of points
as the input; in other words, the points should be sampled from the image before
using them within this function. As opposed to other versions of this function,
this version also classifies the points in Feature Collection format

Arguments:
inputtedFeatureCollection: an ee.FeatureCollection() of sampled points object with a property of interest
k: the number of folds
classifierOfChoice: the classifier/regressor of choice
propertyToPredictAsString: the name of the property to predict as a string object
propertiesUsedInPrediction: a list of the properties used as independent variables

N.B. This version adds a post-hoc convolve operation to the final image
*/

// ———————————————————————————————————————————————————————————————
// The sections below are the function's code, beginning with
// preparation of the inputted feature collection of sample points

// Prepare variables to assign folds to each feature
var collLength = inputtedFeatureCollection.size();
var sampleSeq = ee.List.sequence(1, collLength);
var inputtedFCWithRand = inputtedFeatureCollection.randomColumn('Rand_Num', 42).sort('Rand_Num').toList(collLength);

// Prep the feature collection with random fold assignment numbers
var preppedListOfFeats = sampleSeq.map(function(numberToSet) {
	return ee.Feature(inputtedFCWithRand.get(ee.Number(numberToSet).subtract(1))).set('Fold_ID', ee.Number(numberToSet));
});


// ———————————————————————————————————————————————————————————————
// This section divides the feature collection into the k folds

// Compute the average size of each fold
var averageFoldSize = collLength.divide(k).floor();

// Compute the remaining features to be distributed (unevenly) across folds
var remainingSampleSize = collLength.mod(k);

// Create a standard fold sequence
var foldSequenceWithoutRemainder = ee.List.sequence(0, k - 1).map(function(fold) {
	var foldStart = ee.Number(fold).multiply(averageFoldSize).add(1);
	var foldEnd = ee.Number(foldStart).add(averageFoldSize.subtract(1));
	var foldNumbers = ee.List.sequence(foldStart, foldEnd);
	return ee.List(foldNumbers);
});

// Add the remaining features to each fold
var remainingFoldSequence = ee.List.sequence(ee.Number(ee.List(foldSequenceWithoutRemainder.get(foldSequenceWithoutRemainder.length().subtract(1))).get(averageFoldSize.subtract(1))).add(1),
	ee.Number(ee.List(foldSequenceWithoutRemainder.get(foldSequenceWithoutRemainder.length().subtract(1))).get(averageFoldSize.subtract(1))).add(ee.Number(remainingSampleSize)));

// Finalize a list of lists describing which features will go into each fold
var listsWithRemaindersAdded = foldSequenceWithoutRemainder.zip(remainingFoldSequence).map(function(list) {
	return ee.List(list).flatten();
});
var finalFoldLists = listsWithRemaindersAdded.cat(foldSequenceWithoutRemainder.slice(listsWithRemaindersAdded.length()));
var mainFoldList = ee.List.sequence(0, k - 1);

// Compute the collected training data
var trainingData = mainFoldList.map(function(foldNumber) {
	var listWithoutFold = finalFoldLists.get(foldNumber);
	var foldListOfLists = ee.FeatureCollection(preppedListOfFeats).filter(ee.Filter.inList('Fold_ID', listWithoutFold).not()).toList(collLength);
	return foldListOfLists;
});

// Compute the validation folds
var validationData = mainFoldList.map(function(foldNumber) {
	var listWithoutFold = finalFoldLists.get(foldNumber);
	var foldListOfLists = ee.FeatureCollection(preppedListOfFeats).filter(ee.Filter.inList('Fold_ID', listWithoutFold)).toList(collLength);
	return foldListOfLists;
});


// ———————————————————————————————————————————————————————————————
// Train the data and retrieve the values at the validation points

// Retrieve the validation data from the validation folds
var validationResults = mainFoldList.map(function(foldNumber) {
  // Train the classifiers on the training data
	var trainingFold = ee.FeatureCollection(ee.List(trainingData.get(foldNumber)));
	var trainedClassifier = classifierOfChoice.train(trainingFold, propertyToPredictAsString, propertiesUsedInPrediction);
	
	// Classify the validation folds using the trained classifiers
	var validationResults = ee.FeatureCollection(ee.List(validationData.get(foldNumber))).classify(trainedClassifier,'PredictedValue');
	return validationResults.map(function(f){return f.set('FoldNumber',foldNumber)});
});

var validationResultsFlattened = ee.FeatureCollection(ee.List(validationResults)).flatten();
// print('Validation Results Flattened and Formatted',validationResultsFlattened);

return validationResultsFlattened.map(function(f){return f.select([propertyToPredictAsString,'FoldNumber','PredictedValue'])});

};

print('CV Function run!');

