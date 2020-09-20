# Biogeography-of-soil-microbes

This repository contains the machine learning code used for the analyses in the project ‘The biogeography of soil fungal and bacterial biomass’

There are five steps described below. 

Step 1: Load raw data (i.e., fungal proportion; file: fung_pro_data.csv). Convert points with values of interests and coordinates (latitude and longitude) 
to point shapefiles. 

Step 2: Load point shapefiles into google earth engine and then aggregate soil sample values at 30 arc-seconds resolution as average. 

Note: Step 2 needs two tools and functions which are GapFillAndExtendBounds.js and Aggregate_Points.js

Step 3: Extract environmental covariates (n = 95; see supplementary Table 1) on all the soil samples at 30 arc-seconds resolution based on the coordinates of 
soil samples. 

Note: Step 3 needs one tool which is GapFillAndExtendBounds.js

Step 4: Conduct random forest machine learning algorithms with 10-fold cross validation to select the best model used for extrapolation. 

Note: Step 4 needs two tools which are KFoldCVManualFC.js and Compute_R2_from_CV.js

Step 5: Use the final best models to extrapolate and generate final maps of fungal proportion and total soil microbial biomass C. 

Note: To run the code, you need to get access to the composite of environmental variables named 'compositeOfInterest'. https://code.earthengine.google.com/?asset=users/ky9hc/Composite/compositeOfInterest

For questions and comments, please contact Kailiang Yu ky9hc@virginia.edu and Devin Routh devin.routh@usys.ethz.ch 




