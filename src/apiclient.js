import axios from 'axios';

export async function fetchData() {
  try {
    //   axios.get('http://localhost:8080/api/clientes'),
    //   axios.get('http://localhost:8080/api/ventas'),
    const [products] = await Promise.all([
      axios.get('https://dummyjson.com/products'),
    ]);

    return {
      //   clientes: clientes.data,
      productos: products,
      //   ventas: ventas.data,
    };
  } catch (err) {
    console.error('Error consultando API:', err.message);
    return null;
  }
}
