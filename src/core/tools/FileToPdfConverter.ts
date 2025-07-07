import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * 文件转PDF转换服务
 * 用于将各种格式文件转换为PDF以便在线预览
 */
export class FileToPdfConverter {
  /**
   * 将图片转换为PDF
   * @param {string} imageUrl 图片URL
   * @returns {Promise<Blob>} PDF Blob
   */
  static async imageToPdf(imageUrl: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      
      img.onload = () => {
        try {
          // 计算适合的PDF尺寸
          const imgRatio = img.width / img.height;
          
          // 创建PDF文档，使用A4尺寸
          const pdf = new jsPDF({
            orientation: imgRatio > 1 ? 'landscape' : 'portrait',
            unit: 'mm',
            format: 'a4'
          });
          
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          
          // 计算图片在PDF中的尺寸，保持宽高比
          let imgWidth = pdfWidth;
          let imgHeight = imgWidth / imgRatio;
          
          // 如果计算后的高度超过页面高度，则以高度为基准
          if (imgHeight > pdfHeight) {
            imgHeight = pdfHeight;
            imgWidth = imgHeight * imgRatio;
          }
          
          // 将图片添加到PDF
          pdf.addImage(
            img, 
            'JPEG', 
            (pdfWidth - imgWidth) / 2, 
            (pdfHeight - imgHeight) / 2, 
            imgWidth, 
            imgHeight
          );
          
          // 转换为Blob
          const pdfBlob = pdf.output('blob');
          resolve(pdfBlob);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = (error) => {
        reject(new Error('图片加载失败'));
      };
      
      img.src = imageUrl;
    });
  }
  
  /**
   * 将文本文件转换为PDF
   * @param {string} textContent 文本内容
   * @param {string} fileName 文件名
   * @returns {Promise<Blob>} PDF Blob
   */
  static async textToPdf(textContent: string, fileName: string): Promise<Blob> {
    try {
      // 创建PDF文档
      const pdf = new jsPDF();
      
      // 设置文档属性
      pdf.setProperties({
        title: fileName,
        subject: '文本文件预览',
        creator: '道威系统'
      });
      
      // 设置字体大小
      pdf.setFontSize(12);
      
      // 分割文本为行
      const lines = textContent.split('\n');
      
      // PDF页面尺寸
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const lineHeight = 7;
      
      let y = margin;
      
      // 逐行添加文本
      for (let i = 0; i < lines.length; i++) {
        // 如果当前行将超出页面底部，则添加新页面
        if (y + lineHeight > pageHeight - margin) {
          pdf.addPage();
          y = margin;
        }
        
        // 处理长行，分割成多行
        const textWidth = pdf.getStringUnitWidth(lines[i]) * pdf.internal.getFontSize() / pdf.internal.scaleFactor;
        
        if (textWidth > pageWidth - 2 * margin) {
          // 文本需要换行
          const splitText = pdf.splitTextToSize(lines[i], pageWidth - 2 * margin);
          
          for (let j = 0; j < splitText.length; j++) {
            // 检查是否需要添加新页面
            if (y + lineHeight > pageHeight - margin) {
              pdf.addPage();
              y = margin;
            }
            
            pdf.text(splitText[j], margin, y);
            y += lineHeight;
          }
        } else {
          // 文本不需要换行
          pdf.text(lines[i], margin, y);
          y += lineHeight;
        }
      }
      
      // 转换为Blob
      const pdfBlob = pdf.output('blob');
      return pdfBlob;
    } catch (error) {
      throw new Error('文本转PDF失败: ' + error.message);
    }
  }
  
  /**
   * 使用Office Online预览Office文档并转换为PDF
   * @param {string} fileUrl Office文档URL
   * @returns {string} Office Online预览URL
   */
  static getOfficeOnlinePreviewUrl(fileUrl: string): string {
    // 使用Office Online预览
    return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(fileUrl)}`;
  }
  
  /**
   * 将HTML内容转换为PDF
   * @param {HTMLElement} element HTML元素
   * @param {string} fileName 文件名
   * @returns {Promise<Blob>} PDF Blob
   */
  static async htmlToPdf(element: HTMLElement, fileName: string): Promise<Blob> {
    try {
      // 使用html2canvas将HTML元素转换为canvas
      const canvas = await html2canvas(element, {
        scale: 2, // 提高清晰度
        useCORS: true, // 允许加载跨域图片
        logging: false
      });
      
      // 计算PDF尺寸
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210; // A4宽度，单位mm
      const pageHeight = 297; // A4高度，单位mm
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      // 创建PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // 设置文档属性
      pdf.setProperties({
        title: fileName,
        subject: 'HTML文件预览',
        creator: '道威系统'
      });
      
      // 添加图片到PDF
      let heightLeft = imgHeight;
      let position = 0;
      
      // 添加第一页
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // 如果内容超过一页，添加更多页面
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // 转换为Blob
      const pdfBlob = pdf.output('blob');
      return pdfBlob;
    } catch (error) {
      throw new Error('HTML转PDF失败: ' + error.message);
    }
  }
  
  /**
   * 根据文件类型选择合适的转换方法
   * @param {File} file 文件对象
   * @returns {Promise<{url: string, isPdf: boolean}>} 预览URL和是否为PDF标志
   */
  static async convertToPdf(file: File): Promise<{url: string, isPdf: boolean}> {
    try {
      const fileType = file.type;
      const fileName = file.name;
      
      // 创建临时URL用于访问文件
      const fileUrl = URL.createObjectURL(file);
      
      // 如果文件已经是PDF，直接返回URL
      if (fileType === 'application/pdf') {
        return { url: fileUrl, isPdf: true };
      }
      
      // 图片文件
      if (fileType.startsWith('image/')) {
        const pdfBlob = await this.imageToPdf(fileUrl);
        const pdfUrl = URL.createObjectURL(pdfBlob);
        return { url: pdfUrl, isPdf: true };
      }
      
      // 文本文件
      if (fileType === 'text/plain' || 
          fileType === 'text/html' || 
          fileType === 'text/css' || 
          fileType === 'text/javascript' || 
          fileType === 'application/json' || 
          fileType === 'text/csv') {
        
        // 读取文本内容
        const textContent = await file.text();
        const pdfBlob = await this.textToPdf(textContent, fileName);
        const pdfUrl = URL.createObjectURL(pdfBlob);
        return { url: pdfUrl, isPdf: true };
      }
      
      // Office文档 - 使用Office Online预览
      if (fileType === 'application/msword' || 
          fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          fileType === 'application/vnd.ms-excel' ||
          fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          fileType === 'application/vnd.ms-powerpoint' ||
          fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
        
        // 对于Office文档，我们使用Office Online预览
        // 注意：这需要文件有一个可公开访问的URL
        // 在实际应用中，可能需要先将文件上传到服务器，获取公开URL
        const previewUrl = this.getOfficeOnlinePreviewUrl(fileUrl);
        return { url: previewUrl, isPdf: false };
      }
      
      // 其他类型文件，尝试作为文本处理
      try {
        const textContent = await file.text();
        const pdfBlob = await this.textToPdf(textContent, fileName);
        const pdfUrl = URL.createObjectURL(pdfBlob);
        return { url: pdfUrl, isPdf: true };
      } catch (error) {
        // 如果无法作为文本处理，返回原始URL
        return { url: fileUrl, isPdf: false };
      }
    } catch (error) {
      throw new Error('文件转换失败: ' + error.message);
    }
  }
} 