// Reemplazo integral de términos (16 ago 2026) — versión final de Ale,
// relieve-terminos-y-condiciones.md: devoluciones ampliada (proceso de
// defecto/daño paso a paso), Pago corregido (MXN+IVA, Stripe tarjeta/OXXO,
// sin MSI), "Cuenta del Usuario" reemplazada por "Pedidos sin cuenta"
// (refleja que el Sitio no tiene login), y Envíos/Facturación agregadas
// (verificadas contra /envios y /faq reales).
import { useDocumentHead } from '../lib/useDocumentHead.js';

const h2 = 'font-heading font-bold text-brand-dark text-xl mt-8 mb-3';
const p = 'mb-4';
const link = 'text-passport-ink underline';

export default function Terms() {
  useDocumentHead({
    title: 'Términos y Condiciones — Relieve',
    description:
      'Condiciones de producto, precios y pago, envíos, cancelaciones y devoluciones, y facturación para tu compra en Relieve.',
    canonicalPath: '/terminos',
  });

  return (
    <main className="mx-auto max-w-[70ch] p-8 leading-relaxed">
      <h1 className="font-heading font-bold text-brand-dark text-3xl mb-2">
        Términos y Condiciones
      </h1>
      <p className="text-sm text-[color:var(--color-graphite-muted)] mb-8">
        Última actualización: 16 de agosto de 2026
      </p>

      <h2 className={h2}>Objeto</h2>
      <p className={p}>
        El presente documento constituye un contrato de adhesión para el
        uso de la página de Internet relieve.design (en adelante "Sitio
        Web" y/o "Página Web") que celebran: por una parte, Relieve Design
        (en adelante "la Empresa"), en su calidad de responsable, y por la
        otra, el Usuario, sujetándose ambas partes a lo establecido en este
        documento.
      </p>

      <h2 className={h2}>Aceptación de los Términos y Condiciones</h2>
      <p className={p}>
        Al ingresar y utilizar este portal de Internet, identificado con el
        nombre de dominio relieve.design, propiedad de Relieve Design, el
        Usuario está aceptando los Términos y Condiciones de Uso contenidos
        en este contrato y declara expresamente su aceptación utilizando
        para tal efecto medios electrónicos, en términos de lo dispuesto
        por el artículo 1803 y demás relativos del Código Civil Federal.
      </p>
      <p className={p}>
        Para los efectos del presente contrato, las partes acuerdan que por
        "Usuario" se entenderá a cualquier persona de cualquier naturaleza
        que ingrese al sitio web relieve.design y/o a cualquiera de las
        subpáginas que desplieguen su contenido, y/o a la persona de
        cualquier naturaleza que use cualquiera de los servicios que se
        ofrecen a través de dicha página. En caso de no aceptar en forma
        absoluta y completa los Términos y Condiciones de este contrato, el
        Usuario deberá abstenerse de acceder, utilizar y observar el Sitio
        Web y/o cualquier otro servicio que ofrezca Relieve Design. En caso
        de que el Usuario acceda, utilice y observe el Sitio, se
        considerará como una absoluta y expresa aceptación de los Términos
        y Condiciones de Uso aquí estipulados, los demás documentos
        incorporados a los mismos por referencia, así como las leyes y
        reglamentos aplicables conforme a la legislación vigente para el
        uso del Sitio Web.
      </p>
      <p className={p}>
        Relieve Design no guardará una copia individualizada del presente
        convenio celebrado entre el Usuario y la Empresa, por lo que se
        recomienda al Usuario que guarde una copia de los presentes
        Términos y Condiciones de Uso para su propio expediente. En caso de
        que el Usuario viole lo expresado en estos Términos y Condiciones
        de Uso, Relieve Design podrá cancelar su uso, así como excluir al
        Usuario de futuras operaciones, y/o tomar la acción legal que
        juzgue conveniente para sus intereses.
      </p>

      <h2 className={h2}>Uso del sitio relieve.design</h2>
      <p className={p}>El Usuario y Relieve Design están de acuerdo en que:</p>
      <p className={p}>
        Para poder utilizar la Página Web el Usuario debe tener por lo
        menos 18 años de edad o estar accediendo bajo la supervisión de un
        padre o tutor legal. Relieve Design concede una licencia no
        transferible y revocable para utilizar el Sitio Web, en virtud de
        los Términos y Condiciones de Uso descritos, con el propósito de la
        compra de piezas de diseño vendidas en la misma Página. El Usuario
        sólo podrá imprimir y/o copiar cualquier información y/o imagen
        contenida o publicada en el sitio web relieve.design exclusivamente
        para uso personal, por lo que queda expresa y terminantemente
        prohibido el uso comercial de dicha información. En caso de ser
        persona moral se sujetará a lo dispuesto por el artículo 148,
        fracción IV de la Ley Federal del Derecho de Autor. La reimpresión,
        publicación, distribución, asignación, sublicencia, venta,
        reproducción electrónica o por otro medio, parcial o total, de
        cualquier información, imagen, documento o gráfico que aparezca en
        el sitio web relieve.design, para cualquier uso distinto al
        personal no comercial, le está expresamente prohibido al Usuario, a
        menos de que cuente con la autorización previa y por escrito de
        Relieve Design.
      </p>
      <p className={p}>
        Cualquier infracción de estos Términos y Condiciones de Uso dará
        lugar a la revocación inmediata de la licencia otorgada en este
        apartado, sin previo aviso. Ciertos servicios y las características
        relacionadas que pueden estar disponibles en relieve.design pueden
        requerir el registro o suscripción. El Usuario reconoce que, al
        proporcionar información de carácter personal, otorga a Relieve
        Design la autorización señalada en el artículo 109 de la Ley
        Federal del Derecho de Autor. Si el Usuario decide registrarse o
        suscribirse a cualquiera de estos servicios o funciones
        relacionadas, se compromete a proporcionar información precisa y
        actualizada acerca de sí mismo, y a actualizar rápidamente esa
        información si hay algún cambio. Cada Usuario del sitio es el único
        responsable de mantener sus contraseñas y otros identificadores de
        cuenta seguros. El titular de la cuenta es totalmente responsable
        de todas las actividades que ocurran bajo su contraseña o cuenta.
        El Usuario debe notificar a la Empresa de cualquier uso no
        autorizado de su contraseña o cuenta. De ninguna manera Relieve
        Design será responsable, directa o indirectamente, por cualquier
        pérdida o daño de cualquier tipo incurrido como resultado de la
        falta de cumplimiento con esta sección por parte del Usuario.
      </p>
      <p className={p}>
        Durante el proceso de registro, el Usuario acepta recibir correos
        electrónicos promocionales de relieve.design. No obstante,
        posteriormente puede optar por no recibir tales correos
        promocionales haciendo clic en el enlace en la parte inferior de
        cualquier correo electrónico promocional. Relieve Design se reserva
        el derecho de bloquear el acceso o remover en forma parcial o total
        toda información, comunicación o material que a su exclusivo
        juicio pueda resultar: i) abusivo, difamatorio u obsceno; ii)
        fraudulento, artificioso o engañoso; iii) violatorio de derechos de
        autor, marcas, confidencialidad, secretos industriales o cualquier
        derecho de propiedad intelectual de un tercero; iv) ofensivo, o v)
        que de cualquier forma contravenga lo establecido en este contrato.
        Relieve Design no presume que el contenido de su Página pueda ser
        legalmente visto fuera de los Estados Unidos Mexicanos. El acceso
        al contenido puede no ser legal para ciertas personas o en ciertos
        países. Si el Usuario accede al contenido desde fuera de los
        Estados Unidos Mexicanos, lo hace bajo su propio riesgo y es
        responsable del cumplimiento de las leyes dentro de la jurisdicción
        en la que se encuentre.
      </p>
      <p className={p}>
        Se prohíbe a los Usuarios violar o intentar violar la seguridad del
        Sitio Web y de los sitios afiliados de Relieve Design; quedan
        prohibidas al Usuario: (a) acceder a datos a los cuales no se
        encuentre autorizado o iniciar sesión en un servidor o cuenta para
        la que no tiene acceso autorizado; (b) intentar examinar, escanear
        o probar la vulnerabilidad de un sistema informático o de una red,
        o quebrantar las medidas de seguridad o autenticación sin la
        debida autorización; (c) intentar interferir con el uso de
        cualquier otro Usuario, servicio de hospedaje o red, incluyendo,
        sin limitación, transmitir un virus al Sitio Web; causar saturación
        mediante "inundación" (flooding), "envío de correo no deseado"
        (spamming), "bombardeo de correo" (mailbombing) o "generación de
        fallas" (crashing); (d) el envío de correos electrónicos no
        solicitados; o (e) falsificar cualquier encabezado de paquete
        TCP/IP o información de encabezado en cualquier correo electrónico
        o publicación.
      </p>
      <p className={p}>
        El Usuario reconoce que las violaciones al sistema informático o de
        la seguridad de la red pueden generar responsabilidades civiles o
        penales. Relieve Design investigará situaciones que puedan
        involucrar dichas violaciones y se reserva el derecho de
        denunciarlas a las autoridades, cooperando con la autoridad
        competente en los términos establecidos en la legislación
        aplicable. Para el debido ingreso al Sitio, los Usuarios deberán
        contar con equipos e instalaciones necesarias para su conexión a
        Internet, siendo el uso de estos equipos total responsabilidad de
        los mismos.
      </p>
      <p className={p}>
        Relieve Design está exenta de cualquier responsabilidad que ocurra
        por interrupciones o suspensiones del servicio de acceso a
        Internet ocasionadas por fallas en el sistema de
        telecomunicaciones, en el suministro de energía eléctrica, casos
        fortuitos o de fuerza mayor, o una acción de terceros que pueda
        inhabilitar los equipos que suministran el acceso a la red. Por lo
        anterior, Relieve Design no se responsabiliza por cualquier daño,
        perjuicio o pérdida al Usuario causados por fallas en el sistema,
        en el servidor o en Internet, ni por cualquier virus que pudiera
        infectar el equipo del Usuario como consecuencia del acceso, uso o
        examen del Sitio. Los Usuarios NO podrán imputarle responsabilidad
        alguna ni exigir pago de daños o perjuicios en virtud de
        dificultades técnicas o fallas en los sistemas o en Internet.
        Relieve Design no garantiza el acceso y uso continuado o
        ininterrumpido del Sitio; en caso de indisponibilidad, se procurará
        restablecerlo con la mayor celeridad posible sin que ello genere
        responsabilidad alguna.
      </p>

      <h2 className={h2}>Propiedad intelectual e industrial, y derechos de autor</h2>
      <p className={p}>
        Relieve Design reconoce ser la única propietaria de los derechos de
        propiedad intelectual, ya sean registrados o no registrados, en el
        sitio relieve.design, incluyendo pero no limitado a: proyectos,
        software, código fuente, gráficos, fotografías, videos, imágenes,
        textos, logos, marcas, nombres de dominio, nombres comerciales y
        datos incluidos en la Página Web. La totalidad del contenido de
        nuestra página está protegida por derechos de autor como un
        trabajo colectivo bajo las leyes de derechos de autor en México y
        las convenciones internacionales. Todos los derechos reservados.
        Está prohibida la copia, reproducción, adaptación, modificación,
        distribución, comercialización, licencia, envío, divulgación,
        comunicación pública y/o cualquier otra acción que genere una
        infracción de la legislación mexicana o internacional vigente en
        materia de propiedad intelectual e industrial, así como el uso de
        los contenidos del Sitio sin previa autorización expresa y por
        escrito de Relieve Design. Esto incluye particularmente las
        composiciones topográficas, diseños de mapas en relieve,
        fotografías de producto y demás material de autor propiedad de
        Relieve Design.
      </p>
      <p className={p}>
        En caso de que el Usuario transmita a Relieve Design cualquier
        información, programas, aplicaciones, software o en general
        cualquier material que requiera ser licenciado a través del Sitio
        Web, el Usuario otorga en este acto a Relieve Design una licencia
        perpetua, universal, gratuita, no exclusiva, mundial y libre de
        regalías, que incluye los derechos de sublicenciar, vender,
        reproducir, distribuir, transmitir, crear trabajos derivados,
        exhibirlos y ejecutarlos públicamente. Esto aplica también a
        cualquier pregunta, crítica, comentario, sugerencia o reseña que el
        Usuario envíe. El Usuario renuncia expresamente en este acto a
        llevar a cabo cualquier acción, demanda o reclamación en contra de
        Relieve Design por cualquier actual o eventual violación de
        derechos de autor o propiedad intelectual derivado de dicho
        material.
      </p>
      <p className={p}>
        En caso de considerar que cualquier contenido publicado en el Sitio
        Web es violatorio de derechos de propiedad intelectual o
        industrial, el Usuario podrá realizar una notificación contactando
        a Relieve Design, indicando: i) datos personales verídicos del
        reclamante; ii) identificación del titular de los derechos de
        propiedad intelectual; iii) indicación precisa y completa del
        contenido protegido supuestamente infringido y su localización en
        el Sitio; iv) declaración expresa de que la introducción de dicho
        contenido se realizó sin el consentimiento del titular; v)
        declaración expresa, bajo responsabilidad del reclamante, de que la
        información proporcionada es exacta.
      </p>
      <p className={p}>
        El Sitio Web puede contener vínculos a sitios web de terceros (por
        ejemplo, Instagram o Pinterest). Estos vínculos se proporcionan
        como una ventaja para el Usuario y no implican que Relieve Design
        haya aprobado el contenido de dichos sitios. Relieve Design no es
        responsable por el contenido de sitios web vinculados de terceros.
        Si el Usuario decide acceder a estos sitios, lo hace bajo su propia
        responsabilidad y riesgo.
      </p>

      <h2 className={h2}>Garantía de los productos adquiridos, cancelaciones y devoluciones</h2>

      <p className="font-heading font-bold text-brand-dark text-lg mt-6 mb-2">Naturaleza de la garantía</p>
      <p className={p}>
        Relieve Design garantiza que las piezas comercializadas en el sitio
        relieve.design se fabrican con los materiales descritos en cada
        página de producto (madera parota, impresión en relieve 3D) y no
        presentan defectos ni vicios ocultos que las hagan inadecuadas para
        su uso normal como pieza decorativa. El uso que cada Usuario dé a
        los productos es de su exclusiva responsabilidad. La garantía
        perderá su vigencia en caso de defectos o deterioros causados por
        factores externos, accidentes, desgaste, uso inadecuado, o
        exposición a condiciones no recomendadas (humedad, luz solar
        directa prolongada — ver nuestra Guía de Cuidado). Quedan excluidas
        de la garantía las piezas modificadas o reparadas por el Usuario o
        por personas no autorizadas por Relieve Design.
      </p>

      <p className="font-heading font-bold text-brand-dark text-lg mt-6 mb-2">Cancelaciones y cambios de opinión</p>
      <p className={p}>
        Por ser piezas hechas por encargo, de fabricación bajo pedido (no
        manejamos inventario), no aplican cambios ni devoluciones por
        cambio de opinión una vez confirmado el pedido.
      </p>

      <p className="font-heading font-bold text-brand-dark text-lg mt-6 mb-2">Piezas dañadas en tránsito o con defecto de fabricación</p>
      <p className={p}>
        Si tu pieza llega dañada durante el envío o presenta un defecto de
        fabricación, lo cubrimos de la siguiente forma:
      </p>
      <ul className="list-disc pl-6 mb-4 space-y-1">
        <li>
          Escríbenos a{' '}
          <a className={link} href="mailto:contacto@relieve.design">
            contacto@relieve.design
          </a>{' '}
          dentro de los 7 (siete) días naturales siguientes a la entrega,
          indicando tu número de pedido.
        </li>
        <li>Adjunta fotos claras del daño o defecto, incluyendo el empaque en el que llegó la pieza.</li>
        <li>
          Evaluamos tu caso en un plazo máximo de 3 (tres) días hábiles y
          te confirmamos si procede: reposición de la pieza sin costo
          adicional, o reembolso completo a tu método de pago original,
          procesado a través de Stripe (puede tardar entre 5 y 10 días
          hábiles en reflejarse, según tu banco).
        </li>
      </ul>
      <p className={p}>
        No es necesario que regreses la pieza dañada, salvo que Relieve
        Design te lo solicite expresamente por escrito.
      </p>

      <p className="font-heading font-bold text-brand-dark text-lg mt-6 mb-2">Qué no cubre esta garantía</p>
      <ul className="list-disc pl-6 mb-4 space-y-1">
        <li>Cambios de opinión después de confirmado el pedido.</li>
        <li>
          Variaciones naturales de tono, veta o textura de la madera
          parota — cada pieza de madera es única, y estas variaciones son
          parte del carácter de una pieza de autor, no un defecto de
          fabricación.
        </li>
        <li>
          Daño ocasionado por mal manejo, instalación inadecuada, o
          exposición a condiciones no recomendadas después de la entrega
          (ver Guía de Cuidado).
        </li>
        <li>Reclamaciones presentadas fuera del plazo de 7 días naturales posteriores a la entrega.</li>
      </ul>

      <p className="font-heading font-bold text-brand-dark text-lg mt-6 mb-2">Errores de pedido atribuibles a Relieve Design</p>
      <p className={p}>
        Si recibiste una ciudad, acabado o tamaño distinto al que
        ordenaste, es un error de Relieve Design y se corrige sin costo
        para el Usuario: reposición de la pieza correcta o reembolso
        completo, a elección del Usuario. Debe reportarse dentro de los 7
        días naturales posteriores a la entrega.
      </p>

      <h2 className={h2}>Información sobre productos</h2>
      <p className={p}>
        La información dada sobre cada producto, así como las fotografías o
        videos relativos a los mismos, se exponen a modo exclusivamente
        orientativo. Debido a que cada pieza usa madera natural, pueden
        existir variaciones de tono y veta entre lo mostrado en fotografía
        y la pieza física recibida — estas variaciones son parte del
        carácter de la pieza y no constituyen un error de información.
        Relieve Design no es responsable de ningún otro error o
        inexactitud en la información sobre producto.
      </p>

      <h2 className={h2}>Créditos y promociones</h2>
      <p className={p}>
        Relieve Design informará a los Usuarios suscritos a su newsletter,
        por correo electrónico, sobre promociones y oportunidades futuras,
        con sus respectivas fechas y condiciones. Las promociones tendrán
        términos y condiciones específicos, y los Usuarios interesados en
        participar serán responsables de leerlos y entenderlos. Los
        créditos generados por acciones promocionales (cupones, códigos de
        descuento, etc.) podrán ser intercambiados exclusivamente por
        productos físicos comercializados en relieve.design, y no podrán
        ser intercambiados por otros créditos ni por efectivo.
      </p>

      <h2 className={h2}>Compra de los productos</h2>
      <p className={p}>
        Para realizar la compra de los productos, el Usuario deberá
        realizar el pago de los productos seleccionados, impuestos y
        gastos de envío correspondientes a través de los proveedores de
        servicios de pago que Relieve Design ponga a disposición del
        Usuario en el Sitio Web. El Usuario solamente podrá comprar
        productos a través del Sitio Web para ser entregados en un
        domicilio dentro del territorio de los Estados Unidos Mexicanos.
        Realizada la compra, mediante la aceptación implícita de estos
        Términos y Condiciones, Relieve Design enviará un correo
        electrónico al Usuario informando los detalles de la compra
        realizada. Cada pieza se fabrica por encargo con un tiempo de
        producción de 10 a 15 días hábiles, mismo que se indica en la
        página de producto y en la confirmación de compra.
      </p>
      <p className={p}>
        Relieve Design podrá rechazar, a su elección exclusiva, la
        tramitación del pedido, o no ser capaz de proceder con dicha
        tramitación, en los siguientes casos, sin limitación alguna:
      </p>
      <ul className="list-disc pl-6 mb-4 space-y-1">
        <li>Cuando el producto solicitado no esté disponible;</li>
        <li>
          Cuando la entidad comercializadora de la tarjeta de crédito o
          débito no autorice el pago del precio de compra;
        </li>
        <li>
          Cuando no se cumplan los criterios para la realización de
          pedidos especificados en este apartado.
        </li>
      </ul>

      <h2 className={h2}>Pago</h2>
      <p className={p}>
        Los precios de los productos se muestran en pesos mexicanos (MXN) e
        incluyen IVA. El precio final de tu pedido se recalcula en el
        servidor al momento del pago, como medida de seguridad e
        integridad de precios.
      </p>
      <p className={p}>
        El pago podrá realizarse mediante tarjeta de crédito/débito o pago
        en efectivo en tiendas OXXO, ambos procesados a través de Stripe.
        Relieve Design no ofrece meses sin intereses (MSI) — todos los
        pagos son de contado. La lista de medios de pago disponibles puede
        modificarse en cualquier momento sin previo aviso. El número de
        orden asignado al realizar la transacción no implica por sí mismo
        la aceptación de la transacción. En caso de tener algún problema
        con su orden, el Usuario será contactado por correo electrónico.
        Relieve Design enviará la confirmación de compra vía correo
        electrónico junto con un enlace único para dar seguimiento al
        estatus del pedido — no es necesario crear una cuenta para esto
        (ver sección "Pedidos sin cuenta de usuario"). Solo después de la
        confirmación del pago se libera el pedido para entrar a
        producción. Relieve Design se reserva el derecho de solicitar
        documentos oficiales a sus clientes como medio de validación al
        proceso de adquisición de productos a través del Sitio.
      </p>
      <p className={p}>
        En caso de desconocimiento por parte de la institución bancaria
        correspondiente respecto a los cargos efectuados por el Usuario a
        través de tarjeta de crédito y derivados de operaciones realizadas
        en el Sitio, Relieve Design se reserva el derecho de iniciar las
        acciones legales que correspondan y fincar las responsabilidades
        penales o civiles según sea el caso, así como de realizar todas
        aquellas acciones internas que podrán ir desde hacer el cargo
        nuevamente a la tarjeta de crédito del Usuario hasta la baja
        definitiva del Usuario en el Sitio, sin que se necesite
        autorización previa del Usuario.
      </p>
      <p className={p}>Todas las transacciones con tarjeta serán procesadas a través de Stripe.</p>

      <h2 className={h2}>Orden de aceptación y precios</h2>
      <p className={p}>
        Los precios no incluyen los gastos correspondientes al envío de los
        productos, los cuales se detallarán aparte en cada pedido y
        deberán ser aceptados y pagados, previamente a su envío, directa y
        exclusivamente por el Usuario. El Usuario debe considerar que
        existen casos en los cuales una orden no puede ser procesada por
        diversos motivos. En ese sentido, Relieve Design se reserva el
        derecho de denegar o cancelar cualquier pedido por cualquier razón,
        en cualquier momento. Además, se podrá pedir al Usuario información
        adicional, inclusive antes de aceptar el pedido. Relieve Design
        proporcionará la información de precios más precisa para los
        Usuarios; sin embargo, pueden producirse ciertos errores, como los
        casos en que el precio de un artículo no se muestre correctamente
        en la Página Web. La Empresa se reserva el derecho de denegar o
        cancelar cualquier orden en estos casos, y podrá, a su discreción,
        ponerse en contacto con el Usuario para solicitar instrucciones o
        cancelar el pedido, notificándole de tal cancelación. Si por
        alguna razón el precio se muestra en $0.00 o de forma
        manifiestamente errónea, favor de entrar en contacto con Relieve
        Design; por ninguna razón se entenderá que dichos productos no
        tengan precio o se regalen, y los pedidos realizados bajo esta
        situación serán cancelados sin previo aviso.
      </p>

      <h2 className={h2}>Envíos</h2>
      <p className={p}>
        Relieve Design envía a todo el territorio de los Estados Unidos
        Mexicanos. El costo de envío está siempre incluido en el precio de
        la pieza, sin costo adicional ni monto mínimo de compra. El tiempo
        estimado de entrega se calcula en el checkout según el código
        postal del Usuario, considerando el tiempo de producción (bajo
        pedido) más el tiempo de tránsito de paquetería. El Usuario
        recibirá número de rastreo y notificaciones por correo electrónico
        conforme avance su pedido. Las piezas se envían en empaque
        protegido, diseñado específicamente para piezas enmarcadas.
      </p>

      <h2 className={h2}>Facturación</h2>
      <p className={p}>
        El Usuario que requiera factura (CFDI) deberá solicitarla dentro
        del mismo mes calendario en que se realizó la compra,
        proporcionando los datos fiscales correspondientes (RFC, razón
        social, uso de CFDI y domicilio fiscal). La facturación se procesa
        a través de Facturama. Relieve Design no podrá emitir facturas de
        compras solicitadas fuera de dicho plazo, conforme a la normativa
        fiscal aplicable.
      </p>

      <h2 className={h2}>Disponibilidad de productos</h2>
      <p className={p}>
        Todos los productos que se ofrecen en el Sitio están sujetos a
        disponibilidad de producción, por lo que el tiempo de entrega
        puede variar previo aviso de nuestra parte, o incluso podrá
        proceder la cancelación de la orden y la devolución de los cargos
        al Usuario en caso de no poder cumplir con el pedido. Si el tiempo
        de entrega ofrecido no es de entera satisfacción del Usuario, este
        puede solicitar la cancelación de la orden dentro del plazo
        indicado en nuestra sección de garantía, cancelaciones y
        devoluciones.
      </p>

      <h2 className={h2}>Responsabilidad del Usuario en relación a las transacciones</h2>
      <p className={p}>
        El Usuario asume la responsabilidad de todos los costos, tasas,
        impuestos y demandas que se deriven del uso de este Sitio Web. Los
        datos de acceso comunicados al Usuario para su perfil, si aplica,
        han sido concebidos exclusivamente para uso personal y deberán
        tratarse con confidencialidad. Todas las transacciones realizadas
        mediante la cuenta del Usuario serán imputadas al titular de dicha
        cuenta y tendrán carácter vinculante. El Usuario se responsabiliza,
        sin limitaciones, de los daños directos e indirectos, así como los
        daños consecuentes, que pudiera ocasionar por negligencia grave o
        intención ilegal.
      </p>

      <h2 className={h2}>Pedidos sin cuenta de usuario</h2>
      <p className={p}>
        El Sitio no requiere ni ofrece la creación de una cuenta de usuario
        con contraseña. Cada pedido se identifica mediante el correo
        electrónico proporcionado al momento de la compra y un enlace
        único enviado a dicho correo, a través del cual el Usuario puede
        consultar el estatus de producción y envío de su pedido en
        cualquier momento. El Usuario es responsable de proporcionar un
        correo electrónico válido y de resguardar el enlace único de
        seguimiento, ya que el acceso al estatus del pedido depende de
        dicho enlace. Relieve Design no se hace responsable por el acceso
        de terceros al estatus de un pedido si el Usuario comparte
        voluntariamente su enlace de seguimiento.
      </p>

      <h2 className={h2}>Responsabilidad</h2>
      <p className={p}>
        El Usuario se obliga a indemnizar y sacar en paz y a salvo a
        Relieve Design y a sus colaboradores, agentes y representantes
        frente a cualesquier acciones, procedimientos, responsabilidades,
        demandas, reclamaciones, pérdidas, perjuicios, costos, daños y
        gastos, incluyendo honorarios de abogados y asesores externos, que
        se deriven o se relacionen con la violación por parte del Usuario
        de: (i) los presentes Términos y Condiciones, y/o (ii) cualesquiera
        leyes, normas, decretos o regulaciones vigentes.
      </p>
      <p className={p}>
        Relieve Design se reserva el derecho de asumir la defensa y el
        control de cualquier asunto o reclamo que implique o pudiera
        implicar el pago de una indemnización asociada con algún
        incumplimiento del Usuario. El Usuario se compromete a cooperar con
        Relieve Design en el desarrollo de las defensas pertinentes.
      </p>

      <h2 className={h2}>Modificaciones al sitio relieve.design</h2>
      <p className={p}>
        Relieve Design podrá, en cualquier momento y cuando lo considere
        conveniente, sin necesidad de avisar al Usuario, realizar
        correcciones, adiciones, mejoras o modificaciones al contenido,
        presentación, información, servicios, áreas, bases de datos y
        demás elementos de dicho sitio, sin que ello dé lugar ni derecho a
        ninguna reclamación o indemnización, ni que esto implique
        reconocimiento de responsabilidad alguna a favor del Usuario.
      </p>

      <h2 className={h2}>Vigencia, terminación y modificación de los Términos y Condiciones de Uso</h2>
      <p className={p}>
        La Empresa, así como el Usuario, reconocen que los Términos y
        Condiciones son de vigencia ilimitada, y entrarán en vigor a
        partir de su publicación en el Sitio. Relieve Design se reserva el
        derecho de efectuar alteraciones al presente documento sin
        necesidad de previo aviso, por lo que se recomienda al Usuario que
        vuelva a leer con regularidad este documento. Las alteraciones se
        volverán efectivas inmediatamente después de su publicación en el
        Sitio. Una vez realizadas las modificaciones, se presumirá que el
        Usuario que continúe usando el Sitio tendrá pleno conocimiento,
        habrá leído y consentido los Términos y Condiciones reformados. En
        caso de que el Usuario no acepte los términos modificados, deberá
        dejar de utilizar el Sitio Web. Relieve Design podrá en cualquier
        momento suspender el acceso al Sitio Web y/o terminar los
        presentes Términos y Condiciones, sin que ello implique para
        Relieve Design la obligación de indemnizar al Usuario.
      </p>

      <h2 className={h2}>Subsistencia</h2>
      <p className={p}>
        Estos Términos y Condiciones de Uso, así como los términos
        adicionales, constituyen el acuerdo íntegro entre las partes, y
        sustituyen cualquier otro acuerdo o contrato celebrado con
        anterioridad. Cualquier cláusula o provisión del presente contrato
        legalmente declarada inválida será eliminada o modificada a
        elección de Relieve Design, con la finalidad de corregir su vicio o
        defecto, manteniendo el resto de las cláusulas su fuerza,
        obligatoriedad y validez.
      </p>

      <h2 className={h2}>Términos adicionales</h2>
      <p className={p}>
        Ocasionalmente, Relieve Design podrá revisar, actualizar y/o
        agregar a los presentes Términos y Condiciones provisiones
        adicionales relativas a áreas específicas o nuevos servicios que se
        proporcionen en o a través del Sitio Web, los cuales serán
        publicados en las áreas correspondientes para su lectura y
        aceptación. El Usuario reconoce y acepta que dichos términos
        adicionales forman parte integrante del presente contrato para
        todos los efectos legales a que haya lugar.
      </p>

      <h2 className={h2}>Ley aplicable y jurisdicción</h2>
      <p className={p}>
        Estos Términos y Condiciones de Uso se interpretarán y regirán por
        la legislación vigente en México, renunciando a la aplicación de la
        Convención sobre la Compraventa Internacional de Mercaderías.
      </p>

      <h2 className={h2}>Indemnización</h2>
      <p className={p}>
        El Usuario está de acuerdo en indemnizar a Relieve Design, sus
        colaboradores, proveedores y asesores, por cualquier acción,
        demanda o reclamación (incluso honorarios de abogados y costas
        judiciales) derivada de cualquier incumplimiento por parte del
        Usuario al presente convenio, incluyendo, sin limitación: cualquier
        aspecto relativo al uso del sitio web relieve.design; la
        información contenida o disponible en o a través de dicho Sitio;
        injurias, difamación o cualquier otra conducta violatoria del
        presente contrato por parte del Usuario; o la violación a las
        leyes aplicables o tratados internacionales relativos a los
        derechos de autor o propiedad intelectual contenidos en o
        disponibles a través de dicho Sitio Web.
      </p>

      <h2 className={h2}>Otros</h2>
      <p className={p}>
        Si cualquier disposición establecida en los presentes Términos y
        Condiciones es ilegal, nula o de imposible ejecución en alguna
        jurisdicción, no afectará: (i) la legalidad, validez o ejercicio en
        dicha jurisdicción de cualquier otra disposición del presente
        convenio; o (ii) la legalidad, validez o ejercicio en cualquier
        otra jurisdicción de dicha o cualquier otra disposición del
        presente convenio. Relieve Design podrá no ejercer alguno de los
        derechos y facultades conferidos en este documento, lo que no
        implicará en ningún caso la renuncia a los mismos, salvo
        reconocimiento expreso por parte de Relieve Design, o prescripción
        de la acción que corresponda a cada caso. Los encabezados de las
        cláusulas se incorporan al mismo solo por conveniencia y para su
        mejor manejo, por lo que no se considerarán para efectos de su
        interpretación, ni afectarán las obligaciones en él contenidas. Los
        presentes Términos y Condiciones de Uso, el Aviso de Privacidad, y
        cualesquiera modificaciones y/o avisos legales que se publiquen o
        comuniquen de tiempo en tiempo por Relieve Design a través del
        Sitio Web, constituyen la totalidad del acuerdo entre el Usuario y
        Relieve Design en relación con los Servicios ofrecidos.
      </p>

      <h2 className={h2}>Cómo contactarnos</h2>
      <p className={p}>
        Correo:{' '}
        <a className={link} href="mailto:contacto@relieve.design">
          contacto@relieve.design
        </a>
        <br />
        Relieve Design — Estado de México, México
      </p>
    </main>
  );
}
