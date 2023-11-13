const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");
let database = null;

const initializeDatabaseServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`Database Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDatabaseServer();

convertStateDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

convertDistrictDbObjectToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    stateId: dbObject.state_id,
    districtName: dbObject.district_name,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

//Returns a list of all states in the state table
app.get("/states/", async (request, response) => {
  const getAllStatesQuery = `
           SELECT 
              * 
           FROM 
             state;
           `;
  const stateDetails = await database.all(getAllStatesQuery);
  response.send(
    stateDetails.map((eachState) =>
      convertStateDbObjectToResponseObject(eachState)
    )
  );
});

//Returns a state based on the state ID
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStatesBasedOnTheStateId = `
            SELECT 
               * 
            FROM
              state
            WHERE
              state_id=${stateId};
            `;
  const getStates = await database.get(getStatesBasedOnTheStateId);
  response.send(convertStateDbObjectToResponseObject(getStates));
});

// Create a district in the district table
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictDetailsQuery = `
              INSERT INTO 
                   district(district_name,state_id,cases,cured,active,deaths)
              VALUES
                   (
                       '${districtName}',
                       ${stateId},
                       ${cases},
                       ${cured},
                       ${active},
                       ${deaths}
                   )
              `;
  await database.run(addDistrictDetailsQuery);
  response.send("District Successfully Added");
});

//Returns a district based on the district ID
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictsBasedOnTheDistrictId = `
                    SELECT 
                        *
                    FROM
                       district
                    WHERE
                       district_id = ${districtId};
                    `;
  const getDistrict = await database.get(getDistrictsBasedOnTheDistrictId);
  response.send(convertDistrictDbObjectToResponseObject(getDistrict));
});

//Deletes a district from the district table based on the district ID
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictDetailsQuery = `
               DELETE FROM 
                    district
               WHERE
                    district_id=${districtId};
               `;
  await database.run(deleteDistrictDetailsQuery);
  response.send("District Removed");
});

//Updates the details of a specific district based on the district ID
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    stateId,
    districtName,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictDetailsQuery = `
                 UPDATE 
                    district
                 SET
                 
                     district_name = '${districtName}',
                     state_id = ${stateId},
                     cases = ${cases},
                     cured = ${cured},
                     active = ${active},
                     deaths = ${deaths}
                 
                 WHERE
                    district_id = ${districtId};
                 `;
  await database.run(updateDistrictDetailsQuery);
  response.send("District Details Updated");
});

//Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatisticsOfOverallBasedOnStateId = `
           SELECT 
               SUM(cases) as totalCases,
               SUM(cured) as totalCured,
               SUM(active) as totalActive,
               SUM(deaths) as totalDeaths
           FROM
               district
           WHERE
               state_id = ${stateId};
           `;
  const stats = await database.get(getStatisticsOfOverallBasedOnStateId);
  response.send(stats);
});

//Returns an object containing the state name of a district based on the district ID
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `
            SELECT 
              state_name
            FROM
              district
              NATURAL JOIN
              state
            WHERE
              district_id = ${districtId};
            `;
  const state = await database.get(getStateNameQuery);
  response.send({ stateName: state.state_name });
});

module.exports = app;
