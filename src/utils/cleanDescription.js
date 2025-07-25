export const cleanDescription = (text = "") => {
  const frasesAEliminar = [
    "Buena tarde,", "Buenas tardes", "Buena tarde", "Saludos y gracias", "Buenas tardes,",
    "Saludos", "Buena noche", "Buenas noches", "Buen día", "Buena noche, ", ", ", "Hola", 
    "Hola .", " Excelente día. :)", "Gracias.", "Gracias. :)", " Graciasexcelente día. :)", 
    "Gracias", "Quedo en espera de sus comentarios.", 
    " Cualquier duda quedo pendiente", "Cualquier duda o comentario quedo pendiente", 
    "gracias :)","Sin más por el momentoreciban un cordial saludo","Sin más por el momento reciban un cordial saludo.", "Favor de revisar", "favor de revisar"
  ];

  const escapeRegex = (str) => str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

  frasesAEliminar.forEach(frase => {
    const regex = new RegExp(escapeRegex(frase), "gi");
    text = text.replace(regex, "").trim();
  });

  // Elimina puntos o comas al inicio
  text = text.replace(/^([.,\s]+)/, "");

  // Capitaliza la primera letra
  if (text.length > 0) {
    text = text[0].toUpperCase() + text.slice(1);
  }

  // Quita puntos finales extra y agrega uno solo
  text = text.replace(/\.*\s*$/, "") + ".";

  return text;
};
