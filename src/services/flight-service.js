const { StatusCodes } = require('http-status-codes');
const  { FlightRepository } = require('../repositories');
const { Op } = require('sequelize');
const AppError = require('../utils/errors/app-error');

const flightRepository = new FlightRepository();

async function createFlight(data){
    try {
        const flight = await flightRepository.create(data);
        return flight;
    } catch (error) {
        console.log(error);
        if(error.name === 'SequelizeValidationError'){
            let explanation = [];
            error.errors.forEach((ele) => {
                explanation.push(ele.message);
            });
            throw new AppError(explanation, StatusCodes.BAD_REQUEST);
        }
        throw new AppError('Cannot create a new Flight Object', StatusCodes.INTERNAL_SERVER_ERROR);
    }
}

async function getAllFlights(query){
    

        //trips = 'MUM-BLR'
        //prices = 5000-10000
        const customFilter = {};
        const endingTripTime = " 23:59:00";
        // let airportInfo = {};
        let sortFilter = [];
        
        if(query.trips){
            [departureAirportId, arrivalAirportId] = query.trips.split("-");
            customFilter.departureAirportId = departureAirportId;
            customFilter.arrivalAirportId = arrivalAirportId;
            // airportInfo.arrivalAirportId = arrivalAirportId;
            // airportInfo.departureAirportId = departureAirportId;
        }

        if(query.prices){
            [minPrice, maxPrice] = query.prices.split("-");
            customFilter.ticketPrice = {
            [Op.between] : [minPrice , (maxPrice == undefined) ? 100000 : maxPrice ]
            } 
        }
        if(query.traveller){
            customFilter.seatCapacity = {
                [Op.gte]: [query.traveller]
            }
        }
        if(query.tripDate){
            customFilter.departureTime = {
                [Op.between]: [query.tripDate, query.tripDate + endingTripTime]
            }
        }
        if(query.sort){
            const params = query.sort.split(",");
            const sortFilters = params.map((param) => param.split("_"));
            sortFilter = sortFilters;
            console.log(sortFilter);
        }

        try {
        const flights = await flightRepository.getAllFlights(customFilter,sortFilter);

        return flights;
    } catch (error) {
        throw new AppError('Cannot fetch data of Flights', StatusCodes.INTERNAL_SERVER_ERROR);
    }
}

async function getFlight(data){
    try {
        const response = await flightRepository.get(data);
        return response;
    } catch (error) {
        if(error.statusCode == StatusCodes.NOT_FOUND){
            throw new AppError('The flight you requested is not present', error.statusCode);
        }
        throw new AppError('Cannot fetch data of flight', StatusCodes.INTERNAL_SERVER_ERROR);
    }
}

async function updateSeats(data){
    try {
        const response = await flightRepository.updateRemainingSeat(data.flightId, data.seats, data.dec);
        return response;
    } catch (error) {
        return new AppError('Cannot fetch data of flight', StatusCodes.INTERNAL_SERVER_ERROR);
    }
}

async function deleteFlight(id){
    try {
        const response = await flightRepository.destroy(id);
        return response;
    } catch (error) {
        if(error instanceof AppError) throw error;

        throw new AppError('Something went wrong while destroying the flight', StatusCodes.INTERNAL_SERVER_ERROR);
    }
}

module.exports = {
    createFlight,
    getAllFlights,
    getFlight,
    updateSeats,
    deleteFlight
}