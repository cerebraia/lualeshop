import type { Metadata } from 'next';
import { ChevronDown, MessageCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Preguntas frecuentes',
  description: 'Respuestas a las preguntas más comunes sobre Luale Kids Shop.',
};

const FAQS = [
  {
    category: 'Compras',
    items: [
      {
        q: '¿Cómo puedo realizar un pedido?',
        a: 'Selecciona el producto que deseas, elige la talla y color disponibles, y presiona el botón "Pedir por WhatsApp". Te enviaremos al chat con el detalle de tu pedido listo. Luego coordinaremos el pago y la entrega contigo.',
      },
      {
        q: '¿Puedo comprar más de un producto a la vez?',
        a: 'Por supuesto. Puedes enviarnos un mensaje de WhatsApp con todos los productos que deseas y te preparamos un pedido completo.',
      },
      {
        q: '¿Cuáles son los métodos de pago?',
        a: 'Aceptamos pago móvil, transferencia bancaria, Zelle y efectivo. Consulta la disponibilidad según tu método preferido al momento de hacer tu pedido.',
      },
    ],
  },
  {
    category: 'Delivery y envíos',
    items: [
      {
        q: '¿Hacen delivery en Caracas?',
        a: 'Sí, hacemos delivery a toda Caracas. El costo varía según la zona y se coordina al momento del pedido. Consúltanos por WhatsApp para conocer el costo de entrega en tu área.',
      },
      {
        q: '¿Envían a todo el país?',
        a: 'Sí, realizamos envíos nacionales a través de empresas de mensajería como MRW y Zoom. El costo del envío corre por cuenta del comprador y varía según la ciudad de destino.',
      },
      {
        q: '¿Cuánto tarda en llegar mi pedido?',
        a: 'El delivery en Caracas generalmente se realiza en 24-48 horas. Los envíos nacionales dependen de la empresa de mensajería y suelen tardar de 3 a 5 días hábiles.',
      },
    ],
  },
  {
    category: 'Disponibilidad y tallas',
    items: [
      {
        q: '¿Cómo sé si el producto está disponible en mi talla?',
        a: 'En la página de cada producto puedes ver las tallas disponibles. Las tallas agotadas aparecen desactivadas. También puedes consultarnos por WhatsApp si tienes dudas.',
      },
      {
        q: '¿Qué significa "Últimas unidades"?',
        a: 'Significa que quedan pocas unidades disponibles de ese producto o talla. Te recomendamos hacer tu pedido pronto antes de que se agoten.',
      },
      {
        q: '¿Puedo reservar un producto "Próximamente"?',
        a: 'Sí, puedes contactarnos por WhatsApp para inscribirte en nuestra lista de espera y ser de los primeros en adquirirlo cuando llegue.',
      },
    ],
  },
  {
    category: 'Cambios y devoluciones',
    items: [
      {
        q: '¿Hacen cambios de talla?',
        a: 'Aceptamos cambios dentro de los 5 días hábiles siguientes a la recepción del pedido, siempre que la prenda esté sin usar, con su etiqueta original y en perfectas condiciones. El costo del envío para el cambio es responsabilidad del comprador.',
      },
      {
        q: '¿Aceptan devoluciones?',
        a: 'No realizamos reembolsos de dinero, pero sí ofrecemos cambios por otro producto de igual valor. Comunícate con nosotros por WhatsApp para coordinar.',
      },
    ],
  },
  {
    category: 'Contacto',
    items: [
      {
        q: '¿Cómo puedo contactarlos?',
        a: 'La manera más rápida es por WhatsApp al +58 422-0162748. También puedes seguirnos en Instagram @lualekids.shop para ver las últimas novedades.',
      },
      {
        q: '¿Tienen tienda física?',
        a: 'Por ahora somos una tienda online con sede en Caracas. Los pedidos se realizan exclusivamente por WhatsApp.',
      },
    ],
  },
];

export default function PreguntasFrecuentesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-brown mb-3">Preguntas frecuentes</h1>
        <p className="text-brown-light">Todo lo que necesitas saber antes de hacer tu pedido</p>
      </div>

      <div className="space-y-10">
        {FAQS.map((section) => (
          <div key={section.category}>
            <h2 className="text-lg font-bold text-brown mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-rose rounded-full" />
              {section.category}
            </h2>
            <div className="space-y-2">
              {section.items.map((faq) => (
                <details key={faq.q} className="group border border-rose/20 rounded-2xl overflow-hidden bg-white">
                  <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-semibold text-brown text-sm select-none list-none">
                    {faq.q}
                    <ChevronDown
                      size={16}
                      className="text-rose shrink-0 ml-2 transition-transform group-open:rotate-180"
                    />
                  </summary>
                  <div className="px-5 pb-4 text-sm text-brown-light leading-relaxed">{faq.a}</div>
                </details>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Contact CTA */}
      <div className="mt-14 bg-gradient-to-br from-rose/10 to-blue-pastel/10 rounded-3xl p-8 text-center">
        <p className="font-bold text-brown text-lg mb-2">¿Tienes otra pregunta?</p>
        <p className="text-brown-light text-sm mb-5">Estamos aquí para ayudarte. Escríbenos directamente.</p>
        <a
          href="https://wa.me/584220162748"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-2xl transition-colors"
        >
          <MessageCircle size={16} />
          Escríbenos por WhatsApp
        </a>
      </div>
    </div>
  );
}
