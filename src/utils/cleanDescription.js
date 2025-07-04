export const cleanDescription = (text = "") => {
  const frasesAEliminar = [
    "Buena tarde,", "Buenas tardes", "Buena tarde", "Saludos y gracias", "Buenas tardes,",
    "Saludos", "Buena noche", "Buenas noches", "Buen día", "Buena noche, ", ", ", "Hola", "Hola ."
  ];
  frasesAEliminar.forEach(frase => {
    const regex = new RegExp(frase, "gi");
    text = text.replace(regex, "").trim();
  });
  return text;
};
