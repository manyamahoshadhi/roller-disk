const ProjectModel = require("../../modules/Project_Management/project.model.js");
const BidModel = require("../../modules/Tenders/buds.model.js");
const TenderModel = require("../../modules/Tenders/tender.model.js");
const errorHandler = require("../../utils/error.js");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const { promisify } = require("util");
const { finished } = require("stream");

const displaytender = async (req,res,next) => {
    const tenders = await ProjectModel.find({isTender: true});

    return res.status(200).json(tenders);
}



const publishtenders = async (req, res, next) => {
  try {
    const { title, publishdate, closedate, location, description } = req.body;

    // Find the latest tender and increment its ID
    let latestTender = await TenderModel.findOne().sort({ tid: -1 }).limit(1);
    const tid = latestTender ? latestTender.tid + 1 : 1;

    // Check if any required field is missing
    if (!title || !publishdate || !closedate || !location || !description) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const status = "published";

    const newTender = new TenderModel({
      title,
      tid,
      publishdate,
      closedate,
      location,
      status,
      description,
    });

    await newTender.save();

    res.status(201).json({ success: true, message: "Tender was successfully published", data: newTender });
  } catch (error) {
    console.error("Error publishing tender:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};



const displayePublishedTenders = async (req,res,next) => {
    const tenders = await TenderModel.find();

    return res.status(200).json(tenders);
}


const editTender = async (req,res,next) => {
    
    const { closedate, status} = req.body;
    const { id } = req.params;

    const updateTender = await TenderModel.findByIdAndUpdate(
        id,
        {
            $set: {
                closedate,
                status,
            },
        },
        {new: true}
    );

    return res.json({message: "Tender UPdated Succesfully", data: updateTender,});
}

const analysisTenders = async (req,res,next) => {
    


    const alltender = await ProjectModel.countDocuments({isTender: true})
    const finishtenders =  await ProjectModel.countDocuments({isTender: true, status: "completed"})
    const publishedTenders =  await TenderModel.countDocuments({ status : "published"});

    const dataObject = {
      alltenders: alltender,
      finishtenders: finishtenders,
      publishtenders: publishedTenders,
    }
    

    return res.json({message: "Analysis fetched successfully", data: dataObject,});
}

const addBid = async (req, res, next) => {
  try {
    const {id} = req.params;
    const { name, organizationname, address, tel, email, weblink, description } = req.body;
    const date = new Date();

    // Find the latest tender and increment its ID
    let bidid = await BidModel.findOne().sort({ bidid: -1 }).limit(1);
     bidid = bidid ? bidid.bidid + 1 : 1;

    // Check if any required field is missing
    if (!name || !organizationname || !address || !tel || !email || !weblink  || !description) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }


    const newBid = new BidModel({
      bidid, name, organizationname, address, tel, email, weblink, description, date
    });

    await newBid.save();

    res.status(201).json({ success: true, message: "Bid was successfully Added", newBid: newBid });
  } catch (error) {
    console.error("Error adding bid:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const displaybid = async (req,res,next) => {
  const bid = await BidModel.find();

  return res.status(200).json(bid);
}

const deletePublishedTender = async (req, res, next) => {
  const { id} = req.params;
  const deleteObj = await TenderModel.findByIdAndDelete({_id: id});

  return res.status(200).json({data: deleteObj});
}

const deleteBid = async (req, res, next) => {
  const { id} = req.params;
  const deleteObj = await BidModel.findByIdAndDelete({_id: id});

  return res.status(200).json({data: deleteObj});
}


const generatePDF = async () => {
  try {
    // Create a new PDF document
    const doc = new PDFDocument();

    // Add content to the PDF document
    doc.font("Helvetica").fontSize(20).text("Project, Bid, and Tender Report", { underline: true });

    // Fetch projects, bids, and tenders from the database
    const projects = await ProjectModel.find({ isTender: true });
    const bids = await BidModel.find({});
    const tenders = await TenderModel.find({});

    // Table headers for each model
    const projectTableHeader = ["Project ID", "Name", "Location", "Budget", "Start Date", "End Date", "Client Name", "Description"];
    const bidTableHeader = ["Bid ID", "Name", "Organization Name", "Address", "Tel", "Email", "Web Link", "Description", "Date"];
    const tenderTableHeader = ["Tender ID", "Publish Date", "Close Date", "Location", "Description", "Title"];

    // Draw table headers
    const drawTableHeader = (headers, startX, startY) => {
      const tableWidth = 700;
      const tableHeight = 20;
      const columnWidth = tableWidth / headers.length;
      doc.fillColor("black").font("Helvetica-Bold").fontSize(12);
      headers.forEach((header, index) => {
        doc.text(header, startX + index * columnWidth, startY);
      });
      return tableHeight;
    };

    // Draw table rows
   // Draw table rows
const drawTableRows = (data, startX, startY, headers) => {
  const tableWidth = 700;
  const tableHeight = 20;
  const fontSize = 12;
  const padding = 5;
  let currentY = startY + tableHeight;
  doc.font("Helvetica").fontSize(fontSize);
  data.forEach((item, rowIndex) => {
    const rowData = headers.map(header => {
      // Convert values to strings
      const value = item[header.toLowerCase()];
      return String(value);
    });
    rowData.forEach((data, colIndex) => {
      // Draw text as string
      doc.text(data, startX + colIndex * (tableWidth / headers.length), currentY);
    });
    currentY += tableHeight + padding;
  });
};


    // Draw projects table
    let startY = 100;
    startY += doc.fontSize(16).text("Projects", 50, startY).height;
    startY += drawTableHeader(projectTableHeader, 50, startY);
    drawTableRows(projects, 50, startY, projectTableHeader);

    // Draw bids table
    startY += 50;
    startY += doc.fontSize(16).text("Bids", 50, startY).height;
    startY += drawTableHeader(bidTableHeader, 50, startY);
    drawTableRows(bids, 50, startY, bidTableHeader);

    // Draw tenders table
    startY += 50;
    startY += doc.fontSize(16).text("Tenders", 50, startY).height;
    startY += drawTableHeader(tenderTableHeader, 50, startY);
    drawTableRows(tenders, 50, startY, tenderTableHeader);

    // Finalize the PDF document
    const buffer = await new Promise((resolve, reject) => {
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.end();
    });

    return buffer;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};



const getpdf = async (req, res, next) => {
  try {
    const pdfBuffer = await generatePDF();

    // Send the PDF file in the response
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=RentReport.pdf");
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error downloading PDF:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


module.exports = {displaytender,publishtenders, displayePublishedTenders, editTender, analysisTenders, addBid, displaybid, deletePublishedTender, deleteBid, getpdf};