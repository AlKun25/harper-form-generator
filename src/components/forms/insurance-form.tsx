import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate, downloadPdf } from '@/lib/utils';
import { InsuranceForm as InsuranceFormType } from '@/types';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Download, FileText, Building, Calendar, Mail, Phone, Banknote, User, FileCheck } from 'lucide-react';

interface InsuranceFormProps {
  formData: InsuranceFormType;
  onEditForm: (updates: Partial<InsuranceFormType>) => void;
}

export function InsuranceForm({ formData, onEditForm }: InsuranceFormProps) {
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const handleDownload = async () => {
    try {
      setGeneratingPdf(true);
      
      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
      const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
      
      // Add a page
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
      const { width, height } = page.getSize();
      const fontSize = 12;
      const titleSize = 16;
      const headerSize = 14;
      const margin = 50;
      let y = height - margin;
      
      // Add title
      page.drawText('INSURANCE APPLICATION FORM', {
        x: margin,
        y,
        size: titleSize,
        font: timesBold,
        color: rgb(0, 0, 0),
      });
      
      y -= 30;
      
      // Company Information section
      page.drawText('COMPANY INFORMATION', {
        x: margin,
        y,
        size: headerSize,
        font: timesBold,
        color: rgb(0, 0, 0),
      });
      
      y -= 20;
      
      // Company details
      const details = [
        `Company Name: ${formData.companyName}`,
        `Address: ${formData.address}`,
        `City: ${formData.city}`,
        `State: ${formData.state}`,
        `Zip Code: ${formData.zipCode}`,
        `Industry: ${formData.industry}`,
        `Employee Count: ${formData.employeeCount}`,
        `Annual Revenue: $${formData.annualRevenue.toLocaleString()}`,
        `Year Founded: ${formData.yearFounded}`,
      ];
      
      for (const detail of details) {
        page.drawText(detail, {
          x: margin,
          y,
          size: fontSize,
          font: timesRoman,
          color: rgb(0, 0, 0),
        });
        y -= 20;
      }
      
      y -= 10;
      
      // Coverage Information section
      page.drawText('COVERAGE INFORMATION', {
        x: margin,
        y,
        size: headerSize,
        font: timesBold,
        color: rgb(0, 0, 0),
      });
      
      y -= 20;
      
      // Coverage details
      const coverageDetails = [
        `Coverage Limit: $${formData.coverageLimit.toLocaleString()}`,
        `Deductible Amount: $${formData.deductibleAmount.toLocaleString()}`,
        `Effective Date: ${formData.effectiveDate}`,
        `Expiration Date: ${formData.expirationDate}`,
        `Premium Amount: $${formData.premiumAmount.toLocaleString()}`,
      ];
      
      for (const detail of coverageDetails) {
        page.drawText(detail, {
          x: margin,
          y,
          size: fontSize,
          font: timesRoman,
          color: rgb(0, 0, 0),
        });
        y -= 20;
      }
      
      y -= 10;
      
      // Contact Information section
      page.drawText('CONTACT INFORMATION', {
        x: margin,
        y,
        size: headerSize,
        font: timesBold,
        color: rgb(0, 0, 0),
      });
      
      y -= 20;
      
      // Contact details
      const contactDetails = [
        `Contact Name: ${formData.contactName}`,
        `Contact Email: ${formData.contactEmail}`,
        `Contact Phone: ${formData.contactPhone}`,
      ];
      
      for (const detail of contactDetails) {
        page.drawText(detail, {
          x: margin,
          y,
          size: fontSize,
          font: timesRoman,
          color: rgb(0, 0, 0),
        });
        y -= 20;
      }
      
      // Additional Notes section
      if (formData.additionalNotes) {
        y -= 10;
        
        page.drawText('ADDITIONAL NOTES', {
          x: margin,
          y,
          size: headerSize,
          font: timesBold,
          color: rgb(0, 0, 0),
        });
        
        y -= 20;
        
        page.drawText(formData.additionalNotes, {
          x: margin,
          y,
          size: fontSize,
          font: timesRoman,
          color: rgb(0, 0, 0),
          maxWidth: width - (margin * 2),
        });
      }
      
      // Generate binary data of PDF
      const pdfBytes = await pdfDoc.save();
      
      // Generate a filename based on company name
      const filename = `${formData.companyName.replace(/[^a-zA-Z0-9]/g, '_')}_Insurance_Form.pdf`;
      
      // Download the PDF
      downloadPdf(pdfBytes, filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl border dark:border-gray-700 shadow-md bg-white dark:bg-gray-800">
      <CardHeader className="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <CardTitle className="flex items-center text-gray-900 dark:text-gray-100">
          <FileCheck className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
          Insurance Application Form
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        <div className="space-y-4">
          <div className="flex items-center mb-3">
            <Building className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Company Information</h3>
          </div>
          <div className="space-y-3 bg-gray-50 dark:bg-gray-900/30 p-4 rounded-lg border dark:border-gray-700">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Name</label>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2.5 rounded-md text-gray-900 dark:text-gray-100 shadow-sm">
                {formData.companyName}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2.5 rounded-md text-gray-900 dark:text-gray-100 shadow-sm">
                {formData.address}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2.5 rounded-md text-gray-900 dark:text-gray-100 shadow-sm">
                  {formData.city}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State</label>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2.5 rounded-md text-gray-900 dark:text-gray-100 shadow-sm">
                  {formData.state}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Zip Code</label>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2.5 rounded-md text-gray-900 dark:text-gray-100 shadow-sm">
                  {formData.zipCode}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Industry</label>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2.5 rounded-md text-gray-900 dark:text-gray-100 shadow-sm">
                {formData.industry}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Employee Count</label>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2.5 rounded-md text-gray-900 dark:text-gray-100 shadow-sm">
                  {formData.employeeCount}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Annual Revenue</label>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2.5 rounded-md text-gray-900 dark:text-gray-100 shadow-sm">
                  ${formData.annualRevenue.toLocaleString()}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year Founded</label>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2.5 rounded-md text-gray-900 dark:text-gray-100 shadow-sm">
                {formData.yearFounded}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center mb-3">
              <FileText className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Coverage Information</h3>
            </div>
            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/30 p-4 rounded-lg border dark:border-gray-700">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Coverage Limit</label>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2.5 rounded-md text-gray-900 dark:text-gray-100 shadow-sm">
                  ${formData.coverageLimit.toLocaleString()}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deductible Amount</label>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2.5 rounded-md text-gray-900 dark:text-gray-100 shadow-sm">
                  ${formData.deductibleAmount.toLocaleString()}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Effective Date</label>
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2.5 rounded-md text-gray-900 dark:text-gray-100 shadow-sm">
                    {formData.effectiveDate}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiration Date</label>
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2.5 rounded-md text-gray-900 dark:text-gray-100 shadow-sm">
                    {formData.expirationDate}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Premium Amount</label>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2.5 rounded-md text-gray-900 dark:text-gray-100 shadow-sm font-medium text-green-600 dark:text-green-400">
                  ${formData.premiumAmount.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center mb-3 mt-6">
              <User className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Contact Information</h3>
            </div>
            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/30 p-4 rounded-lg border dark:border-gray-700">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Name</label>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2.5 rounded-md text-gray-900 dark:text-gray-100 shadow-sm">
                  {formData.contactName}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Email</label>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2.5 rounded-md text-gray-900 dark:text-gray-100 shadow-sm">
                  {formData.contactEmail}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Phone</label>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2.5 rounded-md text-gray-900 dark:text-gray-100 shadow-sm">
                  {formData.contactPhone}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="flex items-center mb-3">
            <FileText className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Additional Notes</h3>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg text-gray-900 dark:text-gray-100 shadow-sm min-h-[100px] whitespace-pre-wrap bg-gray-50 dark:bg-gray-900/30">
            {formData.additionalNotes}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-4 p-5 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-700">
        <Button 
          onClick={handleDownload} 
          disabled={generatingPdf}
          className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
        >
          {generatingPdf ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Generating PDF...</span>
            </>
          ) : (
            <>
              <Download size={16} />
              <span>Download Form</span>
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 