import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export default async function exportarExcelMujeres(data, mes, anio, base64Logo1, base64Logo2, columnsMUJERES) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Entregable MUJERES");

    // Insertar logos
    const imageId1 = workbook.addImage({ base64: base64Logo1, extension: 'png' });
    const imageId2 = workbook.addImage({ base64: base64Logo2, extension: 'png' });
    sheet.addImage(imageId1, { tl: { col: 1, row: 1 }, ext: { width: 200, height: 100 } });
    sheet.addImage(imageId2, { tl: { col: 12, row: 1 }, ext: { width: 80, height: 80 } });

    // Encabezado institucional
    sheet.mergeCells('A2:C6');
    sheet.getCell('A2').border = {
        top: { style: 'thick' }, bottom: { style: 'thick' },
        left: { style: 'thin' }, right: { style: 'thin' }
    };

    const encabezados = [
        { cell: 'D2', texto: 'Instituto Potosino de Investigación Científica y Tecnológica', bold: true },
        { cell: 'D4', texto: 'Centro Nacional de Supercómputo', bold: false, color: '3a207d' },
        { cell: 'D5', texto: 'Administración de Proyectos', bold: false, color: '3a207d' },
        { cell: 'D6', texto: '"Servicio de Centro de Datos con Servicios Informáticos Asociados en la Modalidad de Hosting" INMUJERES', bold: true }
    ];

    encabezados.forEach(({ cell, texto, bold, color }) => {
        const celda = sheet.getCell(cell);
        const rango = cell.replace(/[A-Z]/g, '') === '2' ? 'D2:K3' : `${cell[0]}${cell.slice(1)}:K${cell.slice(1)}`;
        sheet.mergeCells(rango);
        celda.value = texto;
        celda.font = { name: 'Arial', bold, size: 12, color: color ? { argb: color } : undefined };
        celda.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        celda.border = {
            top: { style: 'thin' }, bottom: { style: cell === 'D6' ? 'thick' : 'thin' },
            left: { style: 'thin' }, right: { style: 'thin' }
        };
    });

    sheet.mergeCells('L2:M5');
    sheet.getCell('L2').border = {
        top: { style: 'thick' }, bottom: { style: 'thin' },
        left: { style: 'thin' }, right: { style: 'thick' }
    };

    sheet.mergeCells('L6:M6');
    const celdaFecha = sheet.getCell('L6');
    const hoy = new Date();
    celdaFecha.value = `Fecha: ${hoy.toLocaleDateString('es-MX')}`;
    celdaFecha.alignment = { horizontal: 'center' };
    celdaFecha.font = { name: 'Arial', italic: true, size: 12 };
    celdaFecha.border = {
        top: { style: 'thin' }, bottom: { style: 'thick' },
        left: { style: 'thin' }, right: { style: 'thick' }
    };

    // Separar datos
    const filtrarDatos = (lista) => {
        return lista.map((item, index) => {
            const nuevo = {};
            columnsMUJERES.forEach(col => {
                nuevo[col] = col === 'No.' ? index + 1 : item[col] || '';
            });
            return nuevo;
        });
    };

    const incidentes = filtrarDatos(data.filter(row => row['Tipo']?.toLowerCase() === 'incidente'));
    const solicitudes = filtrarDatos(data.filter(row => row['Tipo']?.toLowerCase() === 'solicitud'));

    const colorHeader = 'FF283464';

    const estiloTituloSeccion = {
        font: { name: 'Arial', bold: true, size: 14, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colorHeader } },
        alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
        border: {
            top: { style: 'thin' }, bottom: { style: 'thin' },
            left: { style: 'thin' }, right: { style: 'thin' }
        }
    };

    const estiloHeaderColumna = {
        font: { name: 'Arial', bold: true, size: 12, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colorHeader } },
        alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
        border: {
            top: { style: 'thin' }, bottom: { style: 'thin' },
            left: { style: 'thin' }, right: { style: 'thin' }
        }
    };

    let currentRow = 9;

    const agregarSeccion = (titulo, registros) => {
        if (titulo === 'SOLICITUDES' && incidentes.length === 0) {
            sheet.addRow([]); // fila vacía si no hubo incidentes
            currentRow++;
        }

        const filaTitulo = sheet.addRow([]);
        filaTitulo.height = 35;
        sheet.mergeCells(`A${filaTitulo.number}:M${filaTitulo.number}`);
        const celdaTitulo = sheet.getCell(`A${filaTitulo.number}`);
        celdaTitulo.value = `${titulo}`;
        Object.assign(celdaTitulo, estiloTituloSeccion);
        currentRow++;

        const filaEncabezado = sheet.addRow(columnsMUJERES);
        filaEncabezado.height = 30;
        filaEncabezado.eachCell(cell => Object.assign(cell, estiloHeaderColumna));
        currentRow++;

        if (registros.length > 0) {
            registros.forEach(item => {
                const valores = columnsMUJERES.map(col => item[col] || '');
                const fila = sheet.addRow(valores);
                fila.eachCell(cell => {
                    cell.font = { name: 'Arial', size: 11 };
                    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                    cell.border = {
                        top: { style: 'thin' }, bottom: { style: 'thin' },
                        left: { style: 'thin' }, right: { style: 'thin' }
                    };
                });
                currentRow++;
            });
        }

        currentRow++;
    };

    agregarSeccion("INCIDENTES", incidentes);
    agregarSeccion("SOLICITUDES", solicitudes);

    // Sección de resumen al fondo
    sheet.addRow([]);
    currentRow++;

    const filaResumen = sheet.addRow([]);
    sheet.mergeCells(`D${filaResumen.number}:G${filaResumen.number}`);
    const celdaResumen = sheet.getCell(`D${filaResumen.number}`);
   celdaResumen.value = `Resumen:\n INCIDENTES: ${incidentes.length}   |   SOLICITUDES: ${solicitudes.length}`;
celdaResumen.font = { name: 'Arial', size: 18, bold: true, color: { argb: 'FFFFFFFF' } }; // Color blanco
celdaResumen.alignment = { horizontal: 'center', vertical: 'middle' };
celdaResumen.border = {
    top: { style: 'medium' }, bottom: { style: 'medium' },
    left: { style: 'medium' }, right: { style: 'medium' }
};
celdaResumen.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF283464' } // Mismo color que los títulos
};

    currentRow++;

    // Ajustar anchos
    const MAX_WIDTH = 40;
    sheet.columns.forEach(col => {
        let maxLength = 0;
        col.eachCell({ includeEmpty: true }, cell => {
            const texto = typeof cell.value === 'string' ? cell.value : String(cell.value || '');
            maxLength = Math.max(maxLength, texto.length);
        });
        col.width = Math.min(maxLength + 2, MAX_WIDTH);
    });

    // Exportar
    const buffer = await workbook.xlsx.writeBuffer();
    const nombreArchivo = `MUJERES_Entregable_${mes}_${anio}.xlsx`;
    saveAs(new Blob([buffer]), nombreArchivo);
}
