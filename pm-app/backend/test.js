import { doc, collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "./firebase.js";

async function testSubcoleccion() {
  try {
    // Referencia al proyecto con ID fijo o generado
    const proyectoRef = doc(db, "proyectos", "proyecto1");

    // Insertar un anticipo dentro de la subcolección "anticipos"
    const anticipoRef = await addDoc(collection(proyectoRef, "anticipos"), {
      fecha: new Date(),
      monto: 5000,
      descripcion: "Primer anticipo"
    });
    console.log("Anticipo creado con ID:", anticipoRef.id);

    // Leer todos los anticipos del proyecto
    const querySnapshot = await getDocs(collection(proyectoRef, "anticipos"));
    querySnapshot.forEach((doc) => {
      console.log(doc.id, " => ", doc.data());
    });
  } catch (e) {
    console.error("Error:", e);
  }
}

testSubcoleccion();
