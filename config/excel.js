const ExcelJS = require('exceljs')

async function genPrinting({file_name, datas}) {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Lịch sử In")
    worksheet.columns = [
        { header: 'STT', key: 'index', width: 20 },
        { header: 'Name', key: 'name', width: 50 },
        { header: 'Time', key: 'time', width: 50 }
      ];
      console.log(datas[0]);
      await datas.map(row => {
        worksheet.addRow(row);
      });
      
      const fileName = `${process.cwd()}/tmp/files/${file_name}-${Number(new Date())}.xlsx`

      try{
        await workbook.xlsx.writeFile(fileName)
        console.log('Excel file created successfully!')
        return fileName
      }catch(err){
        console.error('Error creating Excel file:', err)
        return null
      }
}

module.exports = {
    genPrinting: genPrinting
}