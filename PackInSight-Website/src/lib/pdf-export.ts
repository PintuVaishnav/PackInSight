import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ScanResult, PackageAnalysis } from './package-scanner';

// Professional enterprise color scheme - muted and sophisticated
const colors = {
  primary: [59, 130, 246],        // Blue 500
  secondary: [139, 92, 246],      // Violet 500
  success: [34, 197, 94],         // Green 500
  warning: [251, 146, 60],        // Orange 400
  danger: [239, 68, 68],          // Red 500
  info: [14, 165, 233],           // Sky 500
  dark: [30, 41, 59],             // Slate 800
  light: [248, 250, 252],         // Slate 50
  white: [255, 255, 255],
  text: [51, 65, 85],             // Slate 700
  textLight: [100, 116, 139],     // Slate 500
  border: [226, 232, 240],        // Slate 200
};

const formatNumber = (num?: number) => {
  if (!num) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const getSeverityColor = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'critical': return colors.danger;
    case 'high': return colors.warning;
    case 'medium': return [251, 191, 36]; // Amber
    case 'low': return colors.info;
    default: return colors.textLight;
  }
};

const getTrustScoreColor = (score: number) => {
  if (score >= 80) return colors.success;
  if (score >= 60) return colors.warning;
  return colors.danger;
};

export function exportToPDF(scanResult: ScanResult, aiSummary?: any) {
  const doc = new jsPDF();
  let yPos = 20;
  
  // ==================== HEADER ====================
  doc.setFillColor(...colors.primary);
  doc.rect(0, 0, 210, 45, 'F');
  
  doc.setTextColor(...colors.white);
  doc.setFontSize(24);
  doc.setFont(undefined, 'bold');
  doc.text('PackInsight Security Report', 14, 20);
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(`Generated: ${new Date().toLocaleString('en-US', { 
    dateStyle: 'medium', 
    timeStyle: 'short' 
  })}`, 14, 28);
  doc.text(`File: ${scanResult.fileName || 'N/A'}`, 14, 33);
  doc.text(`Scan Type: ${scanResult.scanType.toUpperCase()}`, 14, 38);
  
  yPos = 55;
  
  // ==================== EXECUTIVE SUMMARY ====================
  doc.setFillColor(...colors.light);
  doc.rect(0, yPos - 5, 210, 10, 'F');
  doc.setTextColor(...colors.dark);
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Executive Summary', 14, yPos);
  
  yPos += 10;
  
  const summaryData = [
    ['Total Packages', scanResult.totalPackages.toString(), colors.info],
    ['Vulnerable Packages', scanResult.vulnerablePackages.toString(), colors.warning],
    ['Total Vulnerabilities', scanResult.totalVulnerabilities.toString(), colors.danger],
    ['Critical Issues', scanResult.criticalCount.toString(), colors.danger],
    ['High Severity', scanResult.highCount.toString(), colors.warning],
    ['Medium Severity', scanResult.mediumCount.toString(), [251, 191, 36]],
    ['Low Severity', scanResult.lowCount.toString(), colors.info],
    ['Secure Packages', (scanResult.totalPackages - scanResult.vulnerablePackages).toString(), colors.success],
  ];
  
  autoTable(doc, {
    startY: yPos,
    head: [['Metric', 'Count']],
    body: summaryData.map(([metric, value]) => [metric, value]),
    theme: 'grid',
    headStyles: { 
      fillColor: colors.primary,
      textColor: colors.white,
      fontSize: 11,
      fontStyle: 'bold',
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 10,
      textColor: colors.text,
    },
    alternateRowStyles: {
      fillColor: colors.light,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 130 },
      1: { halign: 'center', fontStyle: 'bold', cellWidth: 50 }
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 1) {
        const rowIndex = data.row.index;
        const color = summaryData[rowIndex][2] as number[];
        data.cell.styles.textColor = color;
      }
    },
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 15;
  
  // ==================== PACKAGE DETAILS ====================
  for (let i = 0; i < scanResult.packages.length; i++) {
    const pkg = scanResult.packages[i];
    
    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    // Package header
    const trustScoreColor = getTrustScoreColor(pkg.trustScore);
    doc.setFillColor(...colors.secondary);
    doc.rect(0, yPos - 5, 210, 12, 'F');
    
    doc.setTextColor(...colors.white);
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.text(`Package ${i + 1}/${scanResult.packages.length}: ${pkg.package.name}`, 14, yPos + 2);
    
    // Trust score badge
    doc.setFillColor(...trustScoreColor);
    doc.roundedRect(160, yPos - 3, 35, 8, 2, 2, 'F');
    doc.setTextColor(...colors.white);
    doc.setFontSize(10);
    doc.text(`Score: ${pkg.trustScore}`, 177.5, yPos + 2, { align: 'center' });
    
    yPos += 12;
    
    // Package info box
    doc.setFillColor(250, 250, 255);
    doc.rect(14, yPos, 182, 25, 'F');
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.5);
    doc.rect(14, yPos, 182, 25, 'S');
    
    doc.setTextColor(...colors.text);
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    
    let infoY = yPos + 5;
    doc.text(`Version: ${pkg.metadata.currentVersion || pkg.package.version}`, 18, infoY);
    doc.text(`Ecosystem: ${pkg.package.ecosystem.toUpperCase()}`, 80, infoY);
    if (pkg.metadata.license) {
      doc.text(`License: ${pkg.metadata.license}`, 140, infoY);
    }
    
    infoY += 5;
    if (pkg.metadata.author) {
      doc.text(`Author: ${pkg.metadata.author.substring(0, 35)}`, 18, infoY);
    }
    if (pkg.metadata.lastPublish) {
      doc.text(`Last Updated: ${formatDate(pkg.metadata.lastPublish)}`, 80, infoY);
    }
    if (pkg.vulnerabilities.length > 0) {
      doc.setTextColor(...colors.danger);
      doc.setFont(undefined, 'bold');
      doc.text(`${pkg.vulnerabilities.length} Vulnerabilities Found`, 140, infoY);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...colors.text);
    }
    
    infoY += 5;
    if (pkg.aiDescription) {
      const descLines = doc.splitTextToSize(pkg.aiDescription, 175);
      doc.setFontSize(8);
      doc.setTextColor(...colors.textLight);
      doc.text(descLines.slice(0, 2), 18, infoY);
    }
    
    yPos += 30;
    
    // Trust Score Breakdown
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...colors.dark);
    doc.text('Trust Score Breakdown', 14, yPos);
    yPos += 5;
    
    const breakdownData = [
      ['Security', `${pkg.trustScoreBreakdown.security}%`, colors.info],
      ['Maintenance', `${pkg.trustScoreBreakdown.maintenance}%`, colors.secondary],
      ['Popularity', `${pkg.trustScoreBreakdown.popularity}%`, colors.warning],
      ['Dependencies', `${pkg.trustScoreBreakdown.dependencies}%`, colors.success],
    ];
    
    autoTable(doc, {
      startY: yPos,
      body: breakdownData.map(([label, value]) => [label, value]),
      theme: 'plain',
      columnStyles: {
        0: { cellWidth: 140, fontStyle: 'bold', fontSize: 9 },
        1: { cellWidth: 42, halign: 'center', fontStyle: 'bold', fontSize: 9 }
      },
      bodyStyles: {
        textColor: colors.text,
        cellPadding: 2,
      },
      didParseCell: (data) => {
        if (data.column.index === 1) {
          const color = breakdownData[data.row.index][2] as number[];
          data.cell.styles.textColor = color;
          data.cell.styles.fillColor = [...color, 20] as any;
        }
      },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 8;
    
    // GitHub Statistics
    if (pkg.githubStats) {
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...colors.dark);
      doc.text('GitHub Statistics', 14, yPos);
      yPos += 5;
      
      const githubData = [
        ['Stars', formatNumber(pkg.githubStats.stars)],
        ['Forks', formatNumber(pkg.githubStats.forks)],
        ['Contributors', formatNumber(pkg.githubStats.contributors)],
        ['Pull Requests', formatNumber(pkg.githubStats.pullRequests)],
        ['Open Issues', formatNumber(pkg.githubStats.openIssues)],
        ['Last Commit', formatDate(pkg.githubStats.lastCommit)],
      ];
      
      if (pkg.githubStats.language) {
        githubData.push(['Language', pkg.githubStats.language]);
      }
      
      autoTable(doc, {
        startY: yPos,
        body: githubData,
        theme: 'plain',
        columnStyles: {
          0: { cellWidth: 90, fontStyle: 'bold', fontSize: 9 },
          1: { cellWidth: 92, fontSize: 9 }
        },
        bodyStyles: {
          textColor: colors.text,
          cellPadding: 1.5,
        },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 8;
    }
    
    // Download Statistics
    if (pkg.downloadStats) {
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...colors.dark);
      doc.text('Download Statistics', 14, yPos);
      yPos += 5;
      
      const downloadData = [];
      if (pkg.downloadStats.lastDay !== undefined) {
        downloadData.push(['Last Day', formatNumber(pkg.downloadStats.lastDay)]);
      }
      if (pkg.downloadStats.lastWeek !== undefined) {
        downloadData.push(['Last Week', formatNumber(pkg.downloadStats.lastWeek)]);
      }
      if (pkg.downloadStats.lastMonth !== undefined) {
        downloadData.push(['Last Month', formatNumber(pkg.downloadStats.lastMonth)]);
      }
      
      if (downloadData.length > 0) {
        autoTable(doc, {
          startY: yPos,
          body: downloadData,
          theme: 'plain',
          columnStyles: {
            0: { cellWidth: 90, fontStyle: 'bold', fontSize: 9 },
            1: { cellWidth: 92, fontSize: 9 }
          },
          bodyStyles: {
            textColor: colors.text,
            cellPadding: 1.5,
          },
        });
        
        yPos = (doc as any).lastAutoTable.finalY + 8;
      }
    }
    
    // Vulnerabilities
    if (pkg.vulnerabilities.length > 0) {
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFillColor(...colors.danger);
      doc.rect(14, yPos - 3, 182, 8, 'F');
      doc.setTextColor(...colors.white);
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text(`Security Vulnerabilities (${pkg.vulnerabilities.length})`, 18, yPos + 2);
      
      yPos += 10;
      
      const vulnData = pkg.vulnerabilities.map(v => [
        v.title.substring(0, 50) + (v.title.length > 50 ? '...' : ''),
        v.severity.toUpperCase(),
        v.cvss?.toString() || 'N/A',
        v.fixedIn || 'No fix',
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Vulnerability', 'Severity', 'CVSS', 'Fixed In']],
        body: vulnData,
        theme: 'striped',
        headStyles: {
          fillColor: colors.dark,
          textColor: colors.white,
          fontSize: 9,
          fontStyle: 'bold',
        },
        bodyStyles: {
          fontSize: 8,
          textColor: colors.text,
        },
        alternateRowStyles: {
          fillColor: [255, 245, 245],
        },
        columnStyles: {
          0: { cellWidth: 90 },
          1: { cellWidth: 35, halign: 'center', fontStyle: 'bold' },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 32, halign: 'center' },
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 1) {
            const severity = pkg.vulnerabilities[data.row.index].severity.toLowerCase();
            const color = getSeverityColor(severity);
            data.cell.styles.textColor = color;
          }
        },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }
    
    // Separator between packages
    if (i < scanResult.packages.length - 1) {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      } else {
        doc.setDrawColor(...colors.border);
        doc.setLineWidth(0.5);
        doc.line(14, yPos, 196, yPos);
        yPos += 15;
      }
    }
  }
  
  // ==================== RECOMMENDATIONS ====================
  if (aiSummary?.recommendations && aiSummary.recommendations.length > 0) {
    doc.addPage();
    yPos = 20;
    
    doc.setFillColor(...colors.success);
    doc.rect(0, yPos - 5, 210, 12, 'F');
    doc.setTextColor(...colors.white);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('AI-Powered Recommendations', 14, yPos + 2);
    
    yPos += 15;
    
    doc.setTextColor(...colors.text);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    aiSummary.recommendations.forEach((rec: string, index: number) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(...colors.success);
      doc.setLineWidth(0.5);
      doc.roundedRect(14, yPos, 182, 15, 2, 2, 'FD');
      
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...colors.success);
      doc.text(`${index + 1}.`, 18, yPos + 5);
      
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...colors.text);
      const recLines = doc.splitTextToSize(rec, 170);
      doc.text(recLines, 24, yPos + 5);
      
      yPos += 18;
    });
  }
  
  // ==================== FOOTER ====================
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(...colors.dark);
    doc.rect(0, 287, 210, 10, 'F');
    doc.setTextColor(...colors.white);
    doc.setFontSize(8);
    doc.text(
      `PackInsight Security Report | Page ${i} of ${pageCount}`,
      105,
      292,
      { align: 'center' }
    );
    doc.text(
      `Generated on ${new Date().toLocaleDateString()}`,
      14,
      292
    );
    doc.text('Confidential', 196, 292, { align: 'right' });
  }
  
  // Save PDF
  doc.save(`packinsight-report-${Date.now()}.pdf`);
}