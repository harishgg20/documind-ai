// Declare global variable for the script-loaded library
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

export const extractTextFromPDF = async (file: File): Promise<{ page: number; text: string }[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result;
        if (!arrayBuffer) {
          reject(new Error("Failed to read file"));
          return;
        }

        const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        const totalPages = pdf.numPages;
        const extractedData: { page: number; text: string }[] = [];

        for (let i = 1; i <= totalPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((item: any) => item.str)
            .join(' ');
          
          extractedData.push({
            page: i,
            text: pageText
          });
        }

        resolve(extractedData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};
