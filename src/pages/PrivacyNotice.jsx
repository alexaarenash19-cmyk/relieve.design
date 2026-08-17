// Reemplazo integral del aviso (16 ago 2026) — versión final de Ale,
// relieve-aviso-privacidad-LARGO.md, un solo correo de contacto
// (contacto@relieve.design), sin rastro de hola@relieve.mx.
import { useDocumentHead } from '../lib/useDocumentHead.js';

const h2 = 'font-heading font-bold text-brand-dark text-xl mt-8 mb-3';
const h3 = 'font-heading font-bold text-brand-dark text-lg mt-6 mb-2';
const p = 'mb-4';
const ul = 'list-disc pl-6 mb-4 space-y-1';
const link = 'text-passport-ink underline';

export default function PrivacyNotice() {
  useDocumentHead({
    title: 'Aviso de Privacidad — Relieve',
    description:
      'Aviso de privacidad conforme a la LFPDPPP: datos que recabamos, finalidades, terceros y tus derechos ARCO.',
    canonicalPath: '/aviso-privacidad',
  });

  return (
    <main className="mx-auto max-w-[70ch] p-8 leading-relaxed">
      <h1 className="font-heading font-bold text-brand-dark text-3xl mb-2">Aviso de Privacidad</h1>
      <p className="text-sm text-[color:var(--color-graphite-muted)] mb-8">
        Última actualización: 16 de agosto de 2026
      </p>

      <h2 className={h2}>Quiénes somos</h2>
      <p className={p}>
        La dirección de nuestro sitio web es: https://relieve.design. Relieve
        ("Relieve Design", "el Sitio", "nosotros", "nuestro") es un estudio
        mexicano que diseña y fabrica piezas de mapas topográficos en
        relieve, montadas en marco de madera, hechas a mano en México.
      </p>
      <p className={p}>
        Este Aviso de Privacidad describe cómo recopilamos, usamos,
        divulgamos y protegemos tu información personal cuando visitas el
        Sitio, realizas una compra, o te comunicas con nosotros por
        cualquier medio. Es un aviso emitido conforme a la Ley Federal de
        Protección de Datos Personales en Posesión de los Particulares
        (LFPDPPP) de México.
      </p>
      <p className={p}>
        Al usar o acceder a cualquiera de nuestros servicios, aceptas la
        recopilación, uso y divulgación de tu información como se describe
        en este Aviso. Si no estás de acuerdo, te pedimos no usar ni acceder
        al Sitio.
      </p>

      <h2 className={h2}>Qué datos personales recabamos y por qué los recabamos</h2>

      <h3 className={h3}>Información que nos proporcionas directamente</h3>
      <p className={p}>Cuando haces un pedido en relieve.design, recopilamos:</p>
      <ul className={ul}>
        <li>Datos de contacto: nombre, correo electrónico, teléfono.</li>
        <li>Datos de envío: dirección completa a la que se enviará tu pieza.</li>
        <li>
          Datos de pago: procesados directamente por Stripe (ver sección
          "Terceros" abajo) — nosotros no almacenamos el número completo de
          tu tarjeta.
        </li>
        <li>
          Datos fiscales: RFC, razón social, régimen fiscal y uso de CFDI,
          únicamente si solicitas factura.
        </li>
        <li>
          Información de tu pedido: pieza elegida (ciudad/montaña, acabado,
          tamaño), monto pagado, estatus de producción y envío.
        </li>
        <li>
          Comunicaciones: cualquier información que nos compartas al
          escribirnos a nuestro correo de contacto, incluyendo dudas,
          solicitudes de garantía, o comentarios.
        </li>
        <li>
          Suscripción a "Curva de Nivel": si te suscribes a nuestra lista de
          acceso anticipado, recopilamos tu correo electrónico para
          enviarte avisos sobre ciudades nuevas, ediciones especiales y
          descuentos.
        </li>
      </ul>
      <p className={p}>
        No creamos cuenta de usuario ni almacenamos contraseñas. Tu pedido
        se identifica y rastrea mediante tu correo electrónico y un enlace
        único que te enviamos al confirmarse la compra — no es necesario
        registrarte para dar seguimiento a tu pedido.
      </p>

      <h3 className={h3}>Información que recopilamos de forma automática</h3>
      <p className={p}>
        El Sitio carga recursos tipográficos externos (Google Fonts,
        Fontshare) necesarios para mostrar correctamente el diseño de la
        página. Esto puede implicar que tu navegador se conecte a los
        servidores de esos proveedores y les comparta información técnica
        básica (como tu dirección IP), conforme a las políticas de
        privacidad de dichos proveedores.
      </p>
      <p className={p}>
        Al día de esta actualización, el Sitio no utiliza cookies de
        rastreo, píxeles publicitarios, ni herramientas de analítica de
        terceros (como Google Analytics, Meta Pixel o similares). Si en el
        futuro incorporamos herramientas de este tipo, actualizaremos este
        Aviso de Privacidad antes de activarlas, describiendo con precisión
        qué información recopilan y con qué fin.
      </p>

      <h3 className={h3}>Información que obtenemos de terceros</h3>
      <p className={p}>
        Podemos recibir información sobre ti a través de los proveedores que
        nos ayudan a operar el Sitio y cumplir tus pedidos, descritos en la
        sección "Terceros" más abajo.
      </p>

      <h2 className={h2}>Cómo usamos tu información personal</h2>
      <ul className={ul}>
        <li>
          Para procesar y cumplir tu pedido: fabricar tu pieza, coordinar el
          envío, notificarte el estatus de producción y entrega, y
          gestionar cualquier solicitud de garantía.
        </li>
        <li>
          Para facturación: emitir tu CFDI si lo solicitas, a través de
          nuestro proveedor de facturación.
        </li>
        <li>
          Para comunicarnos contigo: responder tus dudas, atender
          solicitudes de soporte, y — si nos autorizas — pedirte una reseña
          una vez entregada tu pieza.
        </li>
        <li>
          Para marketing, solo si te suscribes voluntariamente: enviarte
          avisos sobre ciudades nuevas, ediciones especiales o descuentos a
          través de "Curva de Nivel". Puedes darte de baja en cualquier
          momento.
        </li>
        <li>
          Para seguridad y prevención de fraude: detectar e investigar
          actividad sospechosa relacionada con pagos o pedidos.
        </li>
        <li>
          Para cumplir obligaciones legales: conservar registros fiscales y
          responder a requerimientos de autoridades competentes cuando
          exista obligación legal de hacerlo.
        </li>
      </ul>

      <h2 className={h2}>Cookies</h2>
      <p className={p}>
        El Sitio no utiliza cookies de rastreo ni de publicidad. Los únicos
        recursos externos que se cargan son fuentes tipográficas (Google
        Fonts y Fontshare), necesarias para el diseño visual del Sitio;
        estas conexiones no están diseñadas para rastrear tu actividad ni
        construir un perfil publicitario sobre ti.
      </p>
      <p className={p}>
        Si en el futuro añadimos cookies funcionales (por ejemplo, para
        recordar el contenido de tu carrito de compra entre sesiones) o
        cookies de analítica, lo indicaremos aquí con el detalle
        correspondiente.
      </p>

      <h2 className={h2}>Con quién compartimos tus datos (terceros)</h2>
      <p className={p}>
        Compartimos únicamente los datos estrictamente necesarios, y solo
        con los siguientes proveedores, para los fines de cumplir tu
        pedido:
      </p>
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm border border-line border-collapse">
          <thead>
            <tr className="bg-gallery-white">
              <th className="border border-line p-2 text-left">Proveedor</th>
              <th className="border border-line p-2 text-left">Qué datos recibe</th>
              <th className="border border-line p-2 text-left">Para qué</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-line p-2">Stripe</td>
              <td className="border border-line p-2">Datos de pago (tarjeta, dirección de facturación)</td>
              <td className="border border-line p-2">Procesar el cobro de tu pedido</td>
            </tr>
            <tr>
              <td className="border border-line p-2">Facturama</td>
              <td className="border border-line p-2">Nombre/razón social, RFC, uso de CFDI</td>
              <td className="border border-line p-2">Emitir tu factura, si la solicitas</td>
            </tr>
            <tr>
              <td className="border border-line p-2">Supabase</td>
              <td className="border border-line p-2">Datos de tu pedido (nombre, contacto, dirección, estatus)</td>
              <td className="border border-line p-2">Almacenamiento de la base de datos que opera el Sitio</td>
            </tr>
            <tr>
              <td className="border border-line p-2">Paquetería correspondiente</td>
              <td className="border border-line p-2">Nombre y dirección de envío</td>
              <td className="border border-line p-2">Entregarte tu pieza</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className={p}>
        No vendemos, rentamos, ni compartimos tu información personal con
        fines publicitarios de terceros. No compartimos tu información con
        nadie fuera de esta lista, salvo que la ley nos obligue a hacerlo
        (por ejemplo, un requerimiento de autoridad competente) o en el
        contexto de una eventual transacción comercial (como la venta del
        negocio), en cuyo caso tu información seguiría protegida bajo los
        mismos términos aquí descritos.
      </p>

      <h2 className={h2}>Contenido generado por el usuario</h2>
      <p className={p}>
        Si en el futuro habilitamos una sección de reseñas de producto,
        cualquier contenido que decidas publicar de forma pública (por
        ejemplo, una reseña con tu nombre) será visible para cualquier
        persona que visite el Sitio. No controlamos quién accede a esa
        información una vez publicada, y no somos responsables de la
        privacidad de la información que decidas hacer pública
        voluntariamente.
      </p>

      <h2 className={h2}>Sitios y enlaces de terceros</h2>
      <p className={p}>
        El Sitio puede incluir enlaces a nuestras redes sociales (Instagram,
        Pinterest) u otras plataformas externas. Si sigues esos enlaces, te
        recomendamos revisar las políticas de privacidad de esos sitios —
        no somos responsables de sus prácticas de privacidad ni de la
        seguridad de la información que compartas ahí.
      </p>

      <h2 className={h2}>Datos de menores</h2>
      <p className={p}>
        El Sitio no está dirigido a menores de edad y no recopilamos
        conscientemente información personal de menores de 18 años. Si eres
        madre, padre o tutor de un menor que nos proporcionó información
        sin tu consentimiento, contáctanos para solicitar su eliminación
        inmediata.
      </p>

      <h2 className={h2}>Seguridad y retención de tu información</h2>
      <p className={p}>
        Tomamos medidas razonables para proteger tu información personal,
        incluyendo el uso de proveedores (Stripe, Supabase) que cumplen
        estándares reconocidos de seguridad de datos. Sin embargo, ninguna
        medida de seguridad es infalible, y no podemos garantizar seguridad
        absoluta en la transmisión de información por Internet.
      </p>
      <p className={p}>Conservamos tu información:</p>
      <ul className={ul}>
        <li>
          Datos de pedido: mientras sea necesario para cumplir tu compra y
          atender la garantía de fabricación (7 días posteriores a la
          entrega).
        </li>
        <li>
          Datos fiscales (si solicitaste factura): conforme al plazo mínimo
          que exige el Código Fiscal de la Federación (actualmente 5 años).
        </li>
        <li>
          Correo de suscripción a "Curva de Nivel": hasta que solicites tu
          baja.
        </li>
      </ul>

      <h2 className={h2}>Tus derechos (Derechos ARCO)</h2>
      <p className={p}>Conforme a la LFPDPPP, tienes derecho a:</p>
      <ul className={ul}>
        <li>Acceder a los datos personales que tenemos sobre ti.</li>
        <li>Rectificar tus datos cuando sean inexactos o estén incompletos.</li>
        <li>
          Cancelar tus datos cuando consideres que no se están usando
          conforme a lo establecido en este Aviso.
        </li>
        <li>Oponerte al uso de tus datos para fines específicos, como marketing.</li>
      </ul>
      <p className={p}>
        Para ejercer cualquiera de estos derechos, escríbenos a{' '}
        <a className={link} href="mailto:contacto@relieve.design">
          contacto@relieve.design
        </a>{' '}
        indicando tu nombre y el derecho que deseas ejercer. Podremos
        solicitarte información adicional para verificar tu identidad antes
        de darle trámite a tu solicitud. Responderemos en un plazo
        razonable conforme a lo que establece la ley aplicable.
      </p>
      <p className={p}>
        Si no estás satisfecha/o con nuestra respuesta, tienes derecho a
        presentar una queja ante el Instituto Nacional de Transparencia,
        Acceso a la Información y Protección de Datos Personales (INAI) o
        la autoridad que en su momento resulte competente.
      </p>

      <h2 className={h2}>Transferencias de datos</h2>
      <p className={p}>
        Parte de nuestra infraestructura (como el almacenamiento en
        Supabase o el procesamiento de pagos con Stripe) puede implicar que
        tu información se procese en servidores fuera de México. Tomamos
        medidas razonables para asegurar que estos proveedores mantengan
        estándares de protección de datos adecuados.
      </p>

      <h2 className={h2}>Cambios a este Aviso de Privacidad</h2>
      <p className={p}>
        Podemos actualizar este Aviso de Privacidad de forma periódica para
        reflejar cambios en nuestras prácticas, en la tecnología que
        usamos, o por requerimientos legales. Publicaremos la versión
        revisada en esta misma página, actualizando la fecha de "Última
        actualización". Te recomendamos revisarlo periódicamente.
      </p>

      <h2 className={h2}>Contacto</h2>
      <p className={p}>
        Si tienes dudas sobre este Aviso de Privacidad o quieres ejercer
        tus derechos ARCO, escríbenos a:
      </p>
      <p className="text-sm text-[color:var(--color-graphite-muted)] mt-10">
        <a className={link} href="mailto:contacto@relieve.design">
          contacto@relieve.design
        </a>
      </p>
    </main>
  );
}
