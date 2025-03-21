const { generateTicketPDF } = require('./generateTicket');

(async () => {
    try {
        // Mock data for testing
        const name = "Doe";
        const firstName = "John";
        const email = "john.doe@example.com";
        const paymentId = "TEST12345";
        const category = "VIP";

        console.log("🚀 Starting PDF generation test...");

        // Call the generateTicketPDF function
        const result = await generateTicketPDF(name, firstName, email, paymentId, category);

        console.log("✅ PDF generation test completed successfully!");
        console.log("Generated files:");
        console.log(`- PDF File: ${result.filePath}`);
        console.log(`- QR Code: ${result.qrCodePath}`);
        console.log(`- QR Data: ${result.qrData}`);
    } catch (error) {
        console.error("❌ Error during PDF generation test:", error);
    }
})();