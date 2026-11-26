/*
 * catalogo.js — las tarjetas que trae la app, ordenadas por mazo.
 *
 * Formato de cada línea:  id | portugués | español | nota | ejemplo | traducción del ejemplo
 * "## Nombre" = el mazo de las líneas que siguen (un mazo puede aparecer más de una vez).
 * El orden de las líneas es el orden en que aparecen como nuevas: sigue el plan de la guía
 * "Portugués en 4 semanas" (semana 1: oído, pronunciación, gramática; después, el viaje).
 *
 * Los id NO se cambian nunca (el progreso de cada tarjeta está guardado con su id).
 * Si cambiás algo acá: subí CATALOGO_VERSION y corré generar_audios.py.
 */
self.CATALOGO_VERSION = 1764198000000; // 26/11/2026 20:00 (Argentina)
self.CATALOGO_QUITADAS = ['s17', 's25']; // "puxar / empurrar" (ahora son dos tarjetas) y "roxo"
self.CATALOGO = `
## Falsos amigos
s1 | esquisito | raro | exquisito = delicioso | Que cheiro esquisito! Acho que o leite estragou. | ¡Qué olor raro! Creo que la leche se echó a perder.
s2 | embaraçado | avergonzado | embarazada = grávida | Fiquei embaraçado quando errei o nome dela. | Me dio vergüenza cuando me equivoqué con su nombre.
s3 | polvo | pulpo | polvo = pó | O polvo grelhado desse restaurante é uma delícia. | El pulpo a la parrilla de este restaurante es una delicia.
s4 | pelado | desnudo | pelado = careca | Ele saiu do banho e andou pelado pela casa. | Salió de la ducha y anduvo desnudo por la casa.
s5 | largo | ancho | largo = comprido | O corredor é largo, cabem duas pessoas lado a lado. | El pasillo es ancho, entran dos personas una al lado de la otra.
s6 | apelido | apodo | apellido = sobrenome | O apelido dele é Juninho, mas o nome é João. | Su apodo es Juninho, pero se llama João.
s7 | oficina | taller mecánico | oficina = escritório | Levei o carro na oficina porque o freio estava fazendo barulho. | Llevé el auto al taller porque el freno hacía ruido.
s8 | cena | escena | la cena (comida) = o jantar | Essa cena do filme me fez chorar. | Esa escena de la película me hizo llorar.
s9 | rato | ratón | un rato = um tempinho | Vi um rato correndo na cozinha! | ¡Vi un ratón corriendo en la cocina!
s10 | copo | vaso para tomar | vaso = maceta / inodoro | Me vê um copo de água, por favor? | ¿Me das un vaso de agua, por favor?
s11 | presunto | jamón | presunto = suposto | Quero um sanduíche de presunto e queijo. | Quiero un sándwich de jamón y queso.
s12 | propina | soborno | la propina (al mozo) = a gorjeta | O policial foi preso por aceitar propina. | El policía fue detenido por aceptar un soborno.
s13 | sobremesa | postre | la sobremesa (charla) = o papo depois de comer | De sobremesa, vou querer pudim. | De postre, voy a querer flan.
s14 | chato | aburrido, pesado | chato (plano) = achatado | Esse filme é muito chato, vamos trocar? | Esta película es muy aburrida, ¿cambiamos?
s15 | esperto | vivo, astuto | experto = especialista | Ele é muito esperto, sempre acha um jeito de resolver tudo. | Es muy vivo, siempre encuentra la forma de resolver todo.
s16 | ligar | llamar por teléfono | | Vou te ligar quando chegar no hotel. | Te voy a llamar cuando llegue al hotel.
s18 | todavia | sin embargo | todavía = ainda ("todavía no" = ainda não) | O hotel é caro; todavia, fica perto da praia. | El hotel es caro; sin embargo, queda cerca de la playa.
s19 | logo | enseguida | luego = depois | Espera um pouco, eu volto logo. | Esperá un poco, vuelvo enseguida.
s20 | acordar | despertarse | acordar (ponerse de acuerdo) = combinar | Amanhã preciso acordar às seis para pegar o voo. | Mañana tengo que despertarme a las seis para tomar el vuelo.
s21 | fechar | cerrar | | A que horas a farmácia vai fechar? | ¿A qué hora va a cerrar la farmacia?
s22 | pegar | agarrar, tomar | pegar o ônibus = tomar el colectivo | Vamos pegar um táxi até o aeroporto. | Tomemos un taxi hasta el aeropuerto.
s23 | brincar | jugar, bromear | brincar (saltar) = pular | As crianças querem brincar na areia. | Los chicos quieren jugar en la arena.
s24 | mala | valija | mala (malo) = ruim | Minha mala não chegou no aeroporto. | Mi valija no llegó al aeropuerto.
s26 | legal | bueno, copado | | Que legal! Então vamos juntos. | ¡Qué bueno! Entonces vamos juntos.
fa1 | puxar | tirar (de una puerta) | tirar (a la basura) = jogar fora | Essa porta é de puxar, não de empurrar. | Esta puerta es para tirar, no para empujar.
fa2 | empurrar | empujar (una puerta) | | Tem que empurrar a porta com força. | Hay que empujar la puerta con fuerza.
fa3 | tirar | sacar | tirar foto = sacar una foto | Pode tirar uma foto da gente? | ¿Nos podés sacar una foto?
fa4 | ficar | quedarse / quedar | ¿dónde queda? = onde fica? | Vou ficar três noites no hostel. | Me voy a quedar tres noches en el hostel.
fa5 | pastel | empanada frita | la torta = o bolo | Vou querer um pastel de queijo. | Voy a querer una empanada frita de queso.
fa6 | salsa | perejil | la salsa (para comer) = o molho | Esse peixe tem salsa? | ¿Este pescado tiene perejil?
fa7 | garrafa | botella | | Uma garrafa de água sem gás, por favor. | Una botella de agua sin gas, por favor.
fa8 | borracha | goma, caucho | borracho = bêbado | O chinelo é de borracha. | La ojota es de goma.

## Pronunciación
pr1 | ela | ella | é abierta | Ela é de Natal. | Ella es de Natal.
pr2 | café | café | é abierta | Um café com leite, por favor. | Un café con leche, por favor.
pr3 | ele | él | ê cerrada; la E final suena I: "eli" | Ele trabalha no hostel. | Él trabaja en el hostel.
pr4 | dedo | dedo | ê cerrada; la O final suena U: "dedu" | Machuquei o dedo na prancha. | Me lastimé el dedo con la tabla.
pr5 | português | portugués | ê cerrada | Estou aprendendo português. | Estoy aprendiendo portugués.
pr6 | dentro | adentro | "en" nasal | A chave está dentro da mochila. | La llave está adentro de la mochila.
pr7 | avó | abuela | ó abierta | A avó dele faz um bolo ótimo. | La abuela de él hace una torta buenísima.
pr8 | porta | puerta | ó abierta | Pode fechar a porta? | ¿Podés cerrar la puerta?
pr9 | ótimo | genial | ó abierta; termina en U: "ótimu" | Ótimo, então a gente se vê amanhã! | ¡Genial, entonces nos vemos mañana!
pr10 | avô | abuelo | ô cerrada | O avô dela mora no Rio. | El abuelo de ella vive en Río.
pr11 | oito | ocho | ô cerrada; "oitu" | O ônibus sai às oito. | El colectivo sale a las ocho.
pr12 | ontem | ayer | "on" nasal | Ontem eu fui à praia. | Ayer fui a la playa.
pr13 | ônibus | colectivo | "on" nasal | Qual ônibus vai pra Pipa? | ¿Qué colectivo va a Pipa?
pr14 | pão | pan | ão nasal: "paun", con el aire por la nariz | Tem pão de queijo? | ¿Hay chipá?
pr15 | mão / mal | mano / mal | mão es nasal: "maun"; mal termina en U: "mau" | Lava a mão antes de comer. | Lavate la mano antes de comer.
pr16 | Rio | Río | la R inicial suena como una J suave: "Jiu" | Eu nunca fui ao Rio. | Nunca fui a Río.
pr17 | dia / tia | día / tía | t y d antes de i suenan "ch" e "y": "chia", "yia" | Bom dia! A tia da pousada é muito legal. | ¡Buen día! La señora de la posada es muy copada.
pr18 | Brasil | Brasil | la L final suena U: "Brasiu" | O Brasil é enorme. | Brasil es enorme.

## Gramática
gr1 | Tem uma praia aqui perto? | ¿Hay una playa cerca? | tem = hay (al hablar no se usa há) | Tem wi-fi no quarto? | ¿Hay wifi en la habitación?
gr2 | A gente vai | (nosotros) vamos | a gente = nosotros, con el verbo en 3.ª persona | A gente vai pra praia amanhã. | Mañana vamos a la playa.
gr3 | na praia / do hostel | en la playa / del hostel | contracción obligatoria: em + a = na, de + o = do | Estou na praia, perto do hostel. | Estoy en la playa, cerca del hostel.
gr4 | o meu quarto | mi habitación | el posesivo lleva artículo: o meu, a minha | A minha mala está no meu quarto. | Mi valija está en mi habitación.
gr5 | Você quer? | ¿Querés? | você va con el verbo en 3.ª persona, como usted | Você quer uma cerveja? | ¿Querés una cerveza?
gr6 | pra | para | al hablar: pra (para a), pro (para o) | Esse ônibus vai pra Ponta Negra? | ¿Este colectivo va a Ponta Negra?

## Verbos
vb1 | sou / é / somos / são | ser: soy / sos / somos / son | eu sou, você é, a gente é, nós somos, eles são | Eu sou da Argentina. | Soy de Argentina.
vb2 | estou / está / estamos / estão | estar: estoy / estás / estamos / están | al hablar se acorta: tô, tá | Tô no hostel. E você, tá onde? | Estoy en el hostel. ¿Y vos dónde estás?
vb3 | tenho / tem / temos / têm | tener: tengo / tenés / tenemos / tienen | ter también sirve para hay: tem | Tenho uma reserva no nome de Franco. | Tengo una reserva a nombre de Franco.
vb4 | vou / vai / vamos / vão | ir: voy / vas / vamos / van | vou + infinitivo = futuro: vou surfar | Vou pra Pipa amanhã. | Mañana voy a Pipa.
vb5 | faço / faz / fazemos / fazem | hacer: hago / hacés / hacemos / hacen | faz calor = hace calor | Faz muito calor em Natal. | Hace mucho calor en Natal.
vb6 | posso / pode / podemos / podem | poder: puedo / podés / podemos / pueden | "Pode?" = ¿se puede? / ¿podés? | Posso pagar com cartão? | ¿Puedo pagar con tarjeta?
vb7 | quero / quer / queremos / querem | querer: quiero / querés / queremos / quieren | para pedir es más amable "queria" | Quero conhecer Genipabu. | Quiero conocer Genipabu.

## Supervivencia
sv1 | Oi! Tudo bem? | ¡Hola! ¿Todo bien? | se contesta: "Tudo, e você?" | Oi, gente! Tudo bem com vocês? | ¡Hola, gente! ¿Todo bien con ustedes?
sv2 | Obrigado! / Valeu! | ¡Gracias! (formal / informal) | obrigada si sos mujer | Valeu pela dica! | ¡Gracias por el dato!
sv3 | Desculpa. / Com licença. | Perdón. / Permiso. | com licença = para pasar o interrumpir | Com licença, posso passar? | Permiso, ¿puedo pasar?
sv4 | Não entendi. | No entendí. | | Desculpa, não entendi. Pode repetir? | Perdón, no entendí. ¿Podés repetir?
sv5 | Pode falar mais devagar, por favor? | ¿Podés hablar más despacio, por favor? | devagar = despacio | Ainda tô aprendendo. Pode falar mais devagar? | Todavía estoy aprendiendo. ¿Podés hablar más despacio?
sv6 | Beleza! | ¡Dale! / ¡Todo bien! | sirve para saludar y para decir "ok" | Beleza, te vejo às oito. | Dale, te veo a las ocho.
sv7 | Onde fica...? | ¿Dónde queda...? | fica = queda, está (lugares) | Onde fica a praia do Madeiro? | ¿Dónde queda la playa del Madeiro?

## Alojamiento
al1 | Tenho uma reserva no nome de Franco. | Tengo una reserva a nombre de Franco. | no nome de = a nombre de | Oi! Tenho uma reserva no nome de Franco, pra três noites. | ¡Hola! Tengo una reserva a nombre de Franco, para tres noches.
al2 | A que horas é o café da manhã? | ¿A qué hora es el desayuno? | café da manhã = desayuno | O café da manhã está incluído? | ¿El desayuno está incluido?
al3 | Qual é a senha do wi-fi? | ¿Cuál es la clave del wifi? | senha = contraseña | A senha do wi-fi está na parede da recepção. | La clave del wifi está en la pared de la recepción.
al4 | Onde fica o banheiro? | ¿Dónde está el baño? | banheiro = baño | O banheiro fica no fim do corredor. | El baño está al final del pasillo.
al5 | Que horas é o check-out? | ¿A qué hora es el check-out? | | Posso deixar a mala aqui depois do check-out? | ¿Puedo dejar la valija acá después del check-out?
al6 | pousada | posada | en Pipa casi todo el alojamiento es pousada | A pousada fica perto da praia do Amor. | La posada queda cerca de la playa del Amor.
al7 | ar-condicionado | aire acondicionado | | O quarto tem ar-condicionado? | ¿La habitación tiene aire acondicionado?
al8 | toalha | toalla | | Pode me dar uma toalha de praia? | ¿Me podés dar una toalla de playa?

## Comer y pagar
cp1 | Quanto é? / Quanto fica? | ¿Cuánto es? | | Quanto fica tudo junto? | ¿Cuánto es todo junto?
cp2 | Aceita Pix? / Qual é a chave Pix? | ¿Aceptás Pix? / ¿Cuál es la clave Pix? | Pix = transferencia al instante, la usa todo Brasil | Aceita Pix ou só dinheiro? | ¿Aceptás Pix o solo efectivo?
cp3 | Tem troco? | ¿Tenés cambio? | troco = el vuelto | Só tenho nota de cem, tem troco? | Solo tengo un billete de cien, ¿tenés cambio?
cp4 | dinheiro / cartão | efectivo / tarjeta | dinheiro = plata, efectivo | Pode ser no cartão de crédito? | ¿Puede ser con tarjeta de crédito?
cp5 | O que você recomenda? | ¿Qué me recomendás? | | O que você recomenda de peixe? | ¿Qué pescado me recomendás?
cp6 | Me vê uma cerveja bem gelada. | Dame una cerveza bien fría. | me vê = dame (para pedir) | Me vê duas cervejas bem geladas, por favor. | Dame dos cervezas bien frías, por favor.
cp7 | Queria... | Quería... (para pedir) | más amable que "quero" | Queria uma água de coco, por favor. | Quería un agua de coco, por favor.
cp8 | A conta, por favor. | La cuenta, por favor. | | Moço, a conta, por favor! | ¡Mozo, la cuenta, por favor!
cp9 | gorjeta | propina (al mozo) | muchas cuentas ya traen 10 % de "serviço" | A gorjeta já está incluída na conta? | ¿La propina ya está incluida en la cuenta?
cp10 | almoço / jantar | almuerzo / cena | | A gente vai jantar fora hoje? | ¿Salimos a cenar hoy?
cp11 | tapioca | tapioca (panqueque de mandioca) | típica del Nordeste | Uma tapioca de queijo com coco, por favor. | Una tapioca de queso con coco, por favor.
cp12 | Tá uma delícia! | ¡Está riquísimo! | | Esse peixe tá uma delícia! | ¡Este pescado está riquísimo!

## Moverse
mv1 | Quanto fica a corrida até Ponta Negra? | ¿Cuánto sale el viaje hasta Ponta Negra? | corrida = viaje en taxi o Uber | Moço, quanto fica a corrida até o aeroporto? | Señor, ¿cuánto sale el viaje hasta el aeropuerto?
mv2 | Tem transfer do aeroporto pra Pipa? | ¿Hay traslado del aeropuerto a Pipa? | | O transfer pra Pipa demora umas duas horas. | El traslado a Pipa tarda unas dos horas.
mv3 | Onde é o ponto de ônibus? | ¿Dónde está la parada del colectivo? | ponto = parada | O ponto de ônibus fica do outro lado da rua. | La parada está del otro lado de la calle.
mv4 | à direita / à esquerda / em frente | a la derecha / a la izquierda / derecho | | Vira à direita e segue em frente. | Doblá a la derecha y seguí derecho.
mv5 | perto / longe | cerca / lejos | | É longe daqui? Dá pra ir a pé? | ¿Es lejos de acá? ¿Se puede ir caminando?
mv6 | Pode me deixar aqui. | Me podés dejar acá. | | Pode me deixar aqui na esquina, obrigado. | Me podés dejar acá en la esquina, gracias.
mv7 | aeroporto / voo | aeropuerto / vuelo | | O meu voo sai às duas da tarde. | Mi vuelo sale a las dos de la tarde.

## Verbos
vb8 | digo / diz / dizemos / dizem | decir: digo / decís / decimos / dicen | "Como se diz...?" = ¿Cómo se dice...? | Como se diz "valija" em português? | ¿Cómo se dice "valija" en portugués?
vb9 | vejo / vê / vemos / veem | ver: veo / ves / vemos / ven | "A gente se vê!" = ¡Nos vemos! | A gente se vê amanhã na praia. | Nos vemos mañana en la playa.
vb10 | dou / dá / damos / dão | dar: doy / das / damos / dan | "Dá pra...?" = ¿Se puede...? | Dá pra ir a pé até a praia? | ¿Se puede ir caminando hasta la playa?

## Gramática
gr7 | tá | está / ok | "tá bom" = está bien, dale; "tá?" = ¿sí?, ¿ok? | Tá bom, te espero aqui. | Dale, te espero acá.
gr8 | Vou surfar amanhã. | Mañana voy a surfear. | vou + infinitivo = futuro (la forma más usada) | Hoje à noite vou sair com o pessoal do hostel. | Esta noche voy a salir con la gente del hostel.

## Playa y actividades
pl1 | Pode olhar minhas coisas um minutinho? | ¿Me mirás las cosas un minuto? | | Vou dar um mergulho. Pode olhar minhas coisas um minutinho? | Me voy a meter al agua. ¿Me mirás las cosas un minuto?
pl2 | Tem aula de surf pra iniciante? Quanto custa? | ¿Hay clase de surf para principiantes? ¿Cuánto sale? | | A aula de surf dura duas horas. | La clase de surf dura dos horas.
pl3 | Quero alugar uma prancha. / Como tá o mar hoje? | Quiero alquilar una tabla. / ¿Cómo está el mar hoy? | prancha = tabla | O mar tá bom pra surfar hoje? | ¿El mar está bueno para surfear hoy?
pl4 | Com emoção ou sem emoção? | ¿Con o sin adrenalina? | te lo preguntan en el buggy de Genipabu | No passeio de buggy em Genipabu, quero com emoção! | ¡En el paseo en buggy por Genipabu, quiero con adrenalina!
pl5 | Precisa saber nadar? / Quando a maré tá baixa? | ¿Hay que saber nadar? / ¿Cuándo está baja la marea? | maré = marea | Em Maracajaú, o mergulho é na maré baixa. | En Maracajaú, el buceo es con marea baja.
pl6 | mergulho | buceo, zambullida | dar um mergulho = meterse al agua | Amanhã vou fazer mergulho em Maracajaú. | Mañana voy a hacer buceo en Maracajaú.
pl7 | Vocês buscam no hotel? O que está incluído? | ¿Pasan a buscar por el alojamiento? ¿Qué incluye? | | O passeio inclui almoço? | ¿El paseo incluye almuerzo?
pl8 | protetor solar | protector solar | | Esqueci o protetor solar no hostel. | Me olvidé el protector solar en el hostel.
pl9 | guarda-sol / cadeira | sombrilla / silla (de playa) | | Quanto custa o aluguel do guarda-sol e de duas cadeiras? | ¿Cuánto sale alquilar la sombrilla y dos sillas?
pl10 | golfinhos | delfines | en Pipa se ven en la Baía dos Golfinhos | Dá pra ver golfinhos na Baía dos Golfinhos de manhã. | Se pueden ver delfines en la Bahía de los Delfines a la mañana.

## Social
so1 | De onde você é? / Sou da Argentina. | ¿De dónde sos? / Soy de Argentina. | | Sou de Buenos Aires, na Argentina. | Soy de Buenos Aires, en Argentina.
so2 | Prazer! | ¡Un gusto! | | Prazer, eu sou o Franco. | Un gusto, soy Franco.
so3 | Trabalho como mecânico. | Trabajo de mecánico. | "O que você faz?" = ¿A qué te dedicás? | Eu trabalho como mecânico em Buenos Aires. | Trabajo de mecánico en Buenos Aires.
so4 | Quanto tempo você vai ficar? | ¿Cuánto tiempo te vas a quedar? | | Vou ficar até o dia três de janeiro. | Me voy a quedar hasta el tres de enero.
so5 | Bora pra praia? / Que horas a gente se encontra? | ¿Vamos a la playa? / ¿A qué hora nos encontramos? | bora = vamos | Bora tomar uma cerveja hoje à noite? | ¿Vamos a tomar una cerveza esta noche?
so6 | Qual é o seu Instagram? | ¿Cuál es tu Instagram? | | Me passa o seu Instagram? | ¿Me pasás tu Instagram?

## Números y horarios
nu1 | um, dois, três, quatro, cinco | uno, dos, tres, cuatro, cinco | um/uma y dois/duas cambian según el género | Duas águas e um suco, por favor. | Dos aguas y un jugo, por favor.
nu2 | seis, sete, oito, nove, dez | seis, siete, ocho, nueve, diez | en los números de teléfono el 6 se dice "meia" | O meu número termina em meia, meia, nove. | Mi número termina en seis, seis, nueve.
nu3 | vinte, trinta, cinquenta, cem | veinte, treinta, cincuenta, cien | desde 101: cento e... | A diária é cento e cinquenta reais. | La noche sale ciento cincuenta reales.
nu4 | reais | reales (la plata de Brasil) | R$ 50 = cinquenta reais | Isso custa vinte reais. | Esto cuesta veinte reales.
nu5 | Que horas são? | ¿Qué hora es? | | São duas e meia. | Son las dos y media.
nu6 | de manhã / de tarde / de noite | a la mañana / a la tarde / a la noche | | O passeio sai às sete da manhã. | El paseo sale a las siete de la mañana.
nu7 | hoje / amanhã / depois de amanhã | hoy / mañana / pasado mañana | | Depois de amanhã eu vou pra Natal. | Pasado mañana me voy a Natal.

## Emergencias
em1 | Socorro! | ¡Socorro! / ¡Ayuda! | | Socorro! Alguém chama uma ambulância! | ¡Ayuda! ¡Que alguien llame a una ambulancia!
em2 | Preciso de um médico. | Necesito un médico. | precisar de + algo | Preciso de um médico, rápido! | ¡Necesito un médico, rápido!
em3 | Tô passando mal. | Me siento mal. | | Acho que tô passando mal por causa do sol. | Creo que me siento mal por el sol.
em4 | Onde fica a farmácia? | ¿Dónde queda la farmacia? | | A farmácia fica aberta até as dez. | La farmacia está abierta hasta las diez.
em5 | Perdi o meu celular. | Perdí mi celular. | | Perdi o meu celular na praia. Alguém achou? | Perdí mi celular en la playa. ¿Alguien lo encontró?
em6 | Chama a polícia! | ¡Llamá a la policía! | emergencias: 190 policía, 192 ambulancia | Fui roubado! Chama a polícia! | ¡Me robaron! ¡Llamá a la policía!

## Verbos
vb11 | fui | fui (de ir y de ser) | eu fui, você foi, a gente foi | Ontem eu fui pra Genipabu. | Ayer fui a Genipabu.
vb12 | fiz | hice | eu fiz, você fez | Fiz uma aula de surf hoje. | Hoy hice una clase de surf.
vb13 | tive | tuve | eu tive, você teve | Tive um problema com a reserva. | Tuve un problema con la reserva.
vb14 | comi | comí | -er e -ir: comi, bebi, dormi | Comi uma tapioca deliciosa. | Comí una tapioca riquísima.
vb15 | gostei | me gustó | gostar lleva "de": gostei da praia | Gostei muito de Pipa! | ¡Me gustó mucho Pipa!

## Nordeste
ne1 | Oxente! / Ôxe! | ¡Epa! / ¿Qué? | sorpresa o duda, muy nordestino | Oxente, cadê todo mundo? | ¡Epa! ¿Dónde está todo el mundo?
ne2 | Vixe! | ¡Uy! | | Vixe, esqueci a carteira! | ¡Uy, me olvidé la billetera!
ne3 | massa | copado, buenísimo | | O show de ontem foi massa! | ¡El show de ayer estuvo buenísimo!
ne4 | arretado | genial (o enojado, según el tono) | | Esse passeio foi arretado! | ¡Este paseo estuvo genial!
ne5 | Pia! | ¡Mirá! | pia só = mirá esto (Natal) | Pia só que pôr do sol bonito! | ¡Mirá qué atardecer lindo!
ne6 | chegar | irse (en Natal) | en el resto de Brasil es llegar; "já vou chegando" = ya me voy | Gente, já vou chegando, até amanhã! | ¡Gente, ya me voy, hasta mañana!
ne7 | malhar | burlarse (en Natal) | en el resto de Brasil es ir al gimnasio | Para de malhar ele! | ¡Dejá de burlarte de él!
ne8 | cadê? | ¿dónde está? | se usa en todo Brasil | Cadê o meu chinelo? | ¿Dónde está mi ojota?

## Fiestas
fi1 | Feliz Natal! / Feliz Ano Novo! | ¡Feliz Navidad! / ¡Feliz Año Nuevo! | | Feliz Natal pra você e sua família! | ¡Feliz Navidad para vos y tu familia!
fi2 | Onde vai ser o réveillon? | ¿Dónde va a ser la fiesta de Año Nuevo? | réveillon = la noche del 31 | No réveillon todo mundo se veste de branco. | En Año Nuevo todos se visten de blanco.
fi3 | pular sete ondas | saltar siete olas | tradición de Año Nuevo: un deseo por cada ola | À meia-noite a gente vai pular sete ondas. | A la medianoche vamos a saltar siete olas.
`;
