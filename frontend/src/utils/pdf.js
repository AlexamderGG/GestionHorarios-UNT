// frontend/src/utils/pdf.js
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Genera un PDF a partir de un elemento del DOM utilizando html2canvas y jsPDF.
 * @param {HTMLElement} element - El elemento HTML que se va a renderizar.
 * @param {string} fileName - El nombre del archivo PDF resultante.
 */
export const exportElementToPDF = async (element, fileName = 'reporte.pdf') => {
  if (!element) return;
  
  try {
    const canvas = await html2canvas(element, {
      scale: 2, // Mejora la calidad del texto y gráficos en el PDF
      useCORS: true,
      logging: false,
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210; // Ancho A4 en mm
    const pageHeight = 297; // Alto A4 en mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Primera página
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Manejo de múltiples páginas si el reporte es extenso
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(fileName);
  } catch (error) {
    console.error('Error al generar el PDF:', error);
    alert('Hubo un error al generar el PDF. Por favor, intente nuevamente.');
  }
};