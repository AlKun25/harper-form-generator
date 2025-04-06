// Example: Fill a PDF via the Anvil API
//
// * PDF filling API docs: https://www.useanvil.com/docs/api/fill-pdf
// * Anvil Node.js client: https://github.com/anvilco/node-anvil
//
// This script is runnable as is, all you need to do is supply your own API key
// in the ANVIL_API_KEY environment variable in the .env file at the root of the
// typescript directory. By default this script fills a global sample template.
//
// yarn ts-node examples/fill-pdf.ts
//
// The filled PDF will be saved to `output/fill-output.pdf`. You can open the
// filled PDF immediately after saving the file on OSX machines with the
// `open` command:
//
// yarn ts-node examples/fill-pdf.ts && open output/fill-output.pdf

import fs from 'fs'
import path from 'path'
import Anvil from '@anvilco/anvil'
import 'dotenv/config'

// Run an async function and wait until it is finished.
export default function run (fn: Function) {
  fn().then(() => {
    process.exit(0)
  }).catch((err: Error) => {
    console.log(err.stack || err.message)
    process.exit(1)
  })
}

// The PDF template ID to fill. This PDF template ID is a sample template
// available to anyone.
//
// See https://www.useanvil.com/help/tutorials/set-up-a-pdf-template for details
// on setting up your own template
const Acord125Id = 'PnLw8PoHktjkqVXrznKP'
const Acord126Id = '4G8tWXWI6SSRCo9rcbzp'

const pdfTemplateID = Acord125Id;

// Get your API key from your Anvil organization settings.
// See https://www.useanvil.com/docs/api/getting-started#api-key for more details.
const apiKey = process.env['ANVIL_API_KEY'] ?? ''

const outputDir = path.join(__dirname, 'output');

// Ensure the output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

const outputFilepath = path.join(outputDir, 'fill-output.pdf')

async function fillPDF () {
  const anvilClient = new Anvil({ apiKey })
  const exampleAcord125Data = getExampleAccord125Data()
  // const exampleAcord126Data = getExampleAccord126Data()

  const exampleData = exampleAcord125Data
  console.log('Making fill request...')
  const { statusCode, data, errors } = await anvilClient.fillPDF(pdfTemplateID, exampleData)
  console.log('Finished! Status code:', statusCode) // => 200, 400, 404, etc

  if (statusCode === 200 && data) {
    // `data` will be the filled PDF binary data. It is important that the
    // data is saved with no encoding! Otherwise the PDF file will be corrupt.
    fs.writeFileSync(outputFilepath, data, { encoding: null })
    console.log('Filled PDF saved to:', outputFilepath)
  } else {
    console.log('There were errors!')
    console.log(JSON.stringify(errors, null, 2))
  }
}

function getExampleAccord125Data () {
  return {
    title: "Acord 125",
    fontSize: 10,
    textColor: "#333333",
    data: {
      date: "2025-04-04",
      agency: "Agency Name",
      carrierName: "Carrier Name",
      naic: "NAICS Code",
      policyName: "Policy Name",
      policyNumber: 12345,
      underwriterName: "Underwriter",
      underwriterOfficeAddress: {
        street1: "123 Main St",
        street2: "",
        city: "San Francisco",
        state: "CA",
        zip: "94106",
        country: "US"
      },
      proposedExpirationDate: "2025-04-04",
      applicantName: "Cyrod Consultant",
      sic: "", // TODO: add SIC code for applicant
      federalId: "123456789", // TODO: add FEIN or SSN for applicant
      interest: null, // TODO: check if this is correct
      fullTimeEmployees: 12345,
      descriptionPrimaryOperations: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.",
      agencyContactName: "Agency Contact",
      applicantPhone: {
        num: "5554443333",
        region: "US",
        baseRegion: "US"
      },
      applicantAddress: {
        street1: "123 Main St",
        street2: "#234",
        city: "San Francisco",
        state: "CA",
        zip: "94106",
        country: "US"
      },
      contactName: "Contact Name",
      contactEmail: "testy@example.com",
      contactPhone: {
        num: "5554443333",
        region: "US",
        baseRegion: "US"
      },
      premisesState: {
        street1: "123 Main St",
        street2: "#234",
        city: "San Francisco",
        state: "CA",
        zip: "94106",
        country: "US"
      },
      premisesDOP: "Description of Operations",
      premisesAnnualRevenue: 12345.67,
      dateOfBusinessStarted: "2025-04-04",
      proposedEffectiveDate: "2025-04-04",
      agencyContactEmail: "testy@example.com",
      agencyContactPhone: {
        num: "5554443333",
        region: "US",
        baseRegion: "US"
      },
      producerName: "Producer's Name",
      checkCellPhone: "x",
      checkApplicantIsSubsidary: "Y",
      checkApplicantHasSubsidary: "Y",
      checkHasSafetyProgram: "Y",
      checkExplosives: "Explosives",
      checkOtherInsurance: "Other Insurance",
      checkPolicyCancelled: "Coverage Declined 3 years",
      checkPastLosses: "Past Losses",
      checkCrimeHistory: "Crime Indicted or Commited",
      checkUncorrectSafetyViolations: "Uncorrected Safety Violations",
      checkBankruptcy: "Bankruptcy ",
      checkLien: "Judgement or Lien",
      checkTrust: "N",
      checkForeignOperations: "N",
      checkOtherBusinesses: "N", // Either Y or N
      checkSafetyManual: "x", // Either x or blank
      checkSafetyPosition: "x", // Either x or blank
      priorcarrierGeneral: "Scottsdale Insurance",
    }
  }
}

function getExampleAccord126Data () {
  return {
    title: "Acord 126",
    fontSize: 10,
    textColor: "#333333",
    data: {
      date: "2025-04-04",
      agencyName: "Agency Name",
      carrierName: "Carrier Name",
      naic: "NAIC Code",
      policyNumber: 12345,
      effectiveDate: "2025-04-04",
      applicantName: "Applicant Name",
      checkInsuranceExclusions: "Y",
      numberOfEmployees: 12345,
      checkDesigning: "N",
      checkExplosive: "N",
      checkExcavation: "N",
      checkSubcontractorLimits: "N",
      checkSubcontractorInsurance: "N",
      checkEquipmentLease: "N",
      annualSubcontractorCost: 12345.67,
      percentWorkSubcontracted: 50.3,
      fullTimeStaff: 12345,
      partTimeStaff: 12345,
      product1Short: "Product",
      product1Use: "Intended use",
      installProductsResponse: "N", // Either Y or N
      checkForeignInvolvement: "N", // Either Y or N
      researchAndDevelopmentResponse: "N", // Either Y or N
      guaranteesResponse: "N", // Either Y or N
      aircraftSpaceIndustryResponse: "N", // Either Y or N
      productsRecalledResponse: "N", // Either Y or N
      productsOfOthersResponse: "N", // Either Y or N
      productsUnderLabelResponse: "N", // Either Y or N
      vendorsCoverageResponse: "N", // Either Y or N
      namedInsuredSellResponse: "N", // Either Y or N
      checkMedicare: "N", // Either Y or N
      checkRadioactive: "N", // Either Y or N
      checkHazardous: "N", // Either Y or N
      checkOperationsChange5Y: "N", // Either Y or N
      checkRentEquipment: "N", // Either Y or N
      checkWatercraft: "N", // Either Y or N
      checkParking: "N", // Either Y or N
      checkParkingFee: "N", // Either Y or N
      checkRecreationFacilities: "N", // Either Y or N
      checkLodging: "N", // Either Y or N
      checkSwimmingPool: "N", // Either Y or N
      checkSponsoredSocial: "N", // Either Y or N
      checkSponsoredTeams: "N", // Either Y or N
      checkStructuralAlterations: "N", // Either Y or N
      checkDemolitionExposure: "N", // Either Y or N
      remarks: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.",
      agencyContact: "Producer's Name",
      checkEmployeeLeasing: "N", // Either Y or N
      checkJV: "N", // Either Y or N
      checkLaborInterchange: "N", // Either Y or N
      checkDayCare: "N", // Either Y or N
      checkCrimesOccured: "N", // Either Y or N
      checkSafetyPolicy: "N", // Either Y or N
      checkSafetyRepresentations: "N", // Either Y or N
      generalAggregate: 12345.67,
      checkGeneralLiability: "x", // Either x or blank
      checkOccurance: "x", // Either x or blank
      checkTailCoverage: "N" // Either Y or N
    }
  }
}

run(fillPDF)