import { Student } from '../types/student';

export const exportToCSV = (students: Student[], filename = 'TARAS_ECE_Student_Directory.csv') => {
  const headers = [
    'Register No',
    'Name',
    'Department',
    'Year',
    'Section',
    'Date of Birth',
    'Status',
    'Email',
    'Phone',
  ];

  const rows = students.map(s => [
    `"${s.registerNumber}"`,
    `"${s.name}"`,
    `"ECE"`,
    `"${s.year}"`,
    `"${s.section}"`,
    `"${s.dateOfBirth}"`,
    `"${s.status}"`,
    `"${s.email || ''}"`,
    `"${s.phone || ''}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDFPrint = (students: Student[]) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>TARAS ECE Student Directory Report</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 24px; color: #0f172a; }
          h1 { font-size: 20px; font-weight: bold; margin-bottom: 4px; }
          p { color: #64748b; font-size: 13px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 12px; font-size: 12px; text-align: left; }
          th { background-color: #f1f5f9; font-weight: 600; }
          .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 600; }
          .active { background: #dcfce7; color: #15803d; }
          .inactive { background: #ffe4e6; color: #be123c; }
        </style>
      </head>
      <body>
        <h1>TARAS Student Monitoring System — ECE Department</h1>
        <p>Official Directory Report — Generated on ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString()}</p>
        <p>Total Students: ${students.length} | Department: ECE — Electronics &amp; Communication Engineering</p>
        <table>
          <thead>
            <tr>
              <th>Register No.</th>
              <th>Name</th>
              <th>Department</th>
              <th>Year</th>
              <th>Section</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${students.map(s => `
              <tr>
                <td><strong>${s.registerNumber}</strong></td>
                <td>${s.name}</td>
                <td>ECE</td>
                <td>${s.year}</td>
                <td>${s.section}</td>
                <td><span class="badge ${s.status === 'Active' ? 'active' : 'inactive'}">${s.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
