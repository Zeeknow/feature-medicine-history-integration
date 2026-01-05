const Medicine = require("../models/Medicine");
const Transaction = require("../models/Transaction");
const { web3js, contract } = require("../config/web3");

const ownerAddress = process.env.OWNER_ADDRESS;

if (!ownerAddress) {
  console.error("OWNER_ADDRESS is not defined in environment variables");
  process.exit(1);
}

exports.addMedicine = async (req, res) => {
  try {
    const { name, description, stage } = req.body;

    if (!name || !description) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const nonce = await web3js.eth.getTransactionCount(ownerAddress);
    const gasPrice = await web3js.eth.getGasPrice();

    const data = contract.methods.addMedicine(name, description, stage).encodeABI();

    const tx = {
      from: ownerAddress,
      to: contract.options.address,
      gas: 2000000,
      gasPrice: gasPrice,
      nonce: nonce,
      data: data,
    };

    const signedTx = await web3js.eth.accounts.signTransaction(tx, process.env.OWNER_PRIVATE_KEY);
    const receipt = await web3js.eth.sendSignedTransaction(signedTx.rawTransaction);

    const medicineCounter = await contract.methods.medicineCounter().call();

    const medicine = new Medicine({
      blockchainId: parseInt(medicineCounter),
      name,
      description,
      stage: stage || "Ordered",
    });

    await medicine.save();

    const transaction = new Transaction({
      medicineId: medicine.blockchainId,
      participant: ownerAddress,
      action: "MEDICINE_CREATED",
      transactionHash: receipt.transactionHash,
      details: { medicine: medicine._id },
      timestamp: Date.now()
    });

    await transaction.save();

    res.status(201).json({ message: "Medicine added successfully", medicine, transaction });

  } catch (error) {
    console.error("Error adding medicine:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getAllMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find();
    res.json(medicines);
  } catch (error) {
    console.error("Error fetching medicines:", error);
    res.status(500).json({ error: "Error fetching medicines" });
  }
};

// The new getMedicineHistory:
exports.getMedicineHistory = async (req, res) => {
  try {
    const medicineId = req.params.id;

    // Logic: Ensure we have a valid ID
    if (!medicineId) {
      return res.status(400).json({ error: "Medicine ID is required" });
    }

    // Call: Fetching the history from the Smart Contract
    // Used .call() because it's a 'view' function (no gas cost to read)
    const blockchainHistory = await contract.methods.getFullMedicineHistory(medicineId).call();

    // Formatting the data for the UI
    const formattedHistory = blockchainHistory.map(event => ({
      action: event.action,
      participant: event.participant,
      // Convert Unix seconds to JS milliseconds for Date objects
      timestamp: Number(event.timestamp) * 1000, 
      note: event.note,
      verified: true
    }));

    // Response: Sending back the true audit trail
    res.json({
      success: true,
      medicineId: parseInt(medicineId),
      history: formattedHistory
    });

  } catch (error) {
    // The weak error handling gap fix
    console.error(`Blockchain Fetch Error for ID ${req.params.id}:`, error.message);
    res.status(500).json({ 
      error: "Could not retrieve blockchain history", 
      details: error.message 
    });
  }
};

exports.getMedicineStage = async (req, res) => {
  try {
    const medicineId = req.params.id;

    if (!medicineId) {
      return res.status(400).json({ error: "Medicine ID is required" });
    }

    const medicineIdNum = parseInt(medicineId);

    if (isNaN(medicineIdNum)) {
      return res.status(400).json({ error: "Invalid Medicine ID" });
    }

    const stage = await contract.methods.getMedicineStage(medicineIdNum).call();
    res.json({ medicineId: medicineIdNum, stage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching medicine stage", details: error.message });
  }
};