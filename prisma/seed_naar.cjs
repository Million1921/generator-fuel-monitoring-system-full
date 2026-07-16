const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const naarData = [
    { siteId: "111006", name: "Baldaras Condominium", tankerCapacity: 2000, dgCapacity: 30, dgType: "PRAMAC", genStandardFuelConsumptionPerHr: 7.07 },
    { siteId: "111013", name: "Picok Parliament Resident", tankerCapacity: 3000, dgCapacity: 30, dgType: "Beinin/Mecca", genStandardFuelConsumptionPerHr: 9.9 },
    { siteId: "111015", name: "Felege Yordanos School", tankerCapacity: 1000, dgCapacity: 40, dgType: "Pramac", genStandardFuelConsumptionPerHr: 12.512 },
    { siteId: "111016", name: "Riche", tankerCapacity: 2000, dgCapacity: 20, dgType: "Mistubishi", genStandardFuelConsumptionPerHr: 5.1 },
    { siteId: "111019", name: "Stadium Sahile Silasie Blg", tankerCapacity: 1000, dgCapacity: 15, dgType: "Cummins", genStandardFuelConsumptionPerHr: 4.49 },
    { siteId: "111022", name: "Gibi Gabriel", tankerCapacity: 2000, dgCapacity: 20, dgType: "Mistubishi", genStandardFuelConsumptionPerHr: 5.1 },
    { siteId: "111024", name: "Teklehaimanot Garad Bldg", tankerCapacity: 3000, dgCapacity: 30, dgType: "Beinin/Mecca", genStandardFuelConsumptionPerHr: 7.07 },
    { siteId: "111026", name: "kebena medhanialem", tankerCapacity: 3000, dgCapacity: 30, dgType: "mecca", genStandardFuelConsumptionPerHr: 7.07 },
    { siteId: "111031", name: "Bella", tankerCapacity: 500, dgCapacity: 30, dgType: "PRAMAC", genStandardFuelConsumptionPerHr: 7.3 },
    { siteId: "111036", name: "Menen Condominium", tankerCapacity: 500, dgCapacity: 25, dgType: "Vmmotor", genStandardFuelConsumptionPerHr: 7.82 },
    { siteId: "111042", name: "Kazanchis Gebrina", tankerCapacity: 2000, dgCapacity: 40, dgType: "perkins", genStandardFuelConsumptionPerHr: 12.512 },
    { siteId: "111043", name: "Oromia Region President Office", tankerCapacity: 2000, dgCapacity: 20, dgType: "Pramac", genStandardFuelConsumptionPerHr: 5.1 },
    { siteId: "111046", name: "Art School", tankerCapacity: 2000, dgCapacity: 30, dgType: "PRAMAC", genStandardFuelConsumptionPerHr: 7.82 },
    { siteId: "111049", name: "Kirkos Market", tankerCapacity: 3000, dgCapacity: 30, dgType: "Beinin/Mecca", genStandardFuelConsumptionPerHr: 7.07 },
    { siteId: "111051(1)", name: "Microwave Tele Dg 1", tankerCapacity: 12500, dgCapacity: 1500, dgType: "Lion Rock" },
    { siteId: "111051(2)", name: "Microwave Tele DG 2", tankerCapacity: 12500, dgCapacity: 1500, dgType: "Lion Rock" },
    { siteId: "111051(d)", name: "Microwave Tele new", tankerCapacity: 5000, dgCapacity: 500, dgType: "Cummins" },
    { siteId: "111051(b)", name: "Microwave Tele volvo", tankerCapacity: 5000, dgCapacity: 500, dgType: "VOLVO" },
    { siteId: "111051(a)", name: "Microwave Tele cummins", tankerCapacity: 5000, dgCapacity: 600, dgType: "Cummins" },
    { siteId: "111051(f)", name: "Microwave Tele 12500", tankerCapacity: 12500, dgCapacity: 12500, dgType: "Lion Rock" },
    { siteId: "111052", name: "Ethio telecom HQ", tankerCapacity: 5000, dgCapacity: 500, dgType: "SDMO" },
    { siteId: "111058-1", name: "Leghar DG 1", tankerCapacity: 12500, dgCapacity: 1500, dgType: "Lion Rock" },
    { siteId: "111058-2", name: "Leghar DG 2", tankerCapacity: 12500, dgCapacity: 1500, dgType: "Lion Rock" },
    { siteId: "111058 old", name: "Leghar", tankerCapacity: 5000, dgCapacity: 600, dgType: "VOLVO" },
    { siteId: "111059", name: "Shiromeda Waga Bet", tankerCapacity: 2000, dgCapacity: 30, dgType: "Telhow", genStandardFuelConsumptionPerHr: 9.9 },
    { siteId: "111061", name: "Shiromeda Selase", tankerCapacity: 3300, dgCapacity: 30, dgType: "PRAMAC", genStandardFuelConsumptionPerHr: 7.82 },
    { siteId: "111065", name: "Denberwa Hospital", tankerCapacity: 3300, dgCapacity: 30, dgType: "PRAMAC", genStandardFuelConsumptionPerHr: 7.82 },
    { siteId: "111066", name: "Kokobe ATseba School", tankerCapacity: 3300, dgCapacity: 30, dgType: "PRAMAC", genStandardFuelConsumptionPerHr: 7.82 },
    { siteId: "111067", name: "Abysinea", tankerCapacity: 2000, dgCapacity: 50, dgType: "GREEN POWER", genStandardFuelConsumptionPerHr: 9.384 },
    { siteId: "111076", name: "Minilik 05 Kebele", tankerCapacity: 2000, dgCapacity: 30, dgType: "PRAMAC", genStandardFuelConsumptionPerHr: 7.82 },
    { siteId: "111077", name: "Dashen Bank /Amalga Limitted", tankerCapacity: 3300, dgCapacity: 30, dgType: "Pramac", genStandardFuelConsumptionPerHr: 7.82 },
    { siteId: "111082", name: "Gurd Shola Tele", tankerCapacity: 3000, dgCapacity: 300, dgType: "CUMMINS" },
    { siteId: "111083", name: "Top View", tankerCapacity: 2000, dgCapacity: 25, dgType: "Vmmotor", genStandardFuelConsumptionPerHr: 9.384 },
    { siteId: "111084", name: "Eyakem", tankerCapacity: 2000, dgCapacity: 30, dgType: "PRAMAC", genStandardFuelConsumptionPerHr: 7.82 },
    { siteId: "111087", name: "Ararat Area", tankerCapacity: 3000, dgCapacity: 30, dgType: "mecca", genStandardFuelConsumptionPerHr: 7.07 },
    { siteId: "111091", name: "Hillside School", tankerCapacity: 500, dgCapacity: 30, dgType: "PRAMAC", genStandardFuelConsumptionPerHr: 7.82 },
    { siteId: "111093", name: "Kotobe College", tankerCapacity: 800, dgCapacity: 30, dgType: "PRAMAC", genStandardFuelConsumptionPerHr: 7.82 },
    { siteId: "111094", name: "Yemiserach Center", tankerCapacity: 2000, dgCapacity: 30, dgType: "PRAMAC", genStandardFuelConsumptionPerHr: 7.82 },
    { siteId: "111096", name: "Akim Genbata", tankerCapacity: 2000, dgCapacity: 30, dgType: "PRAMAC", genStandardFuelConsumptionPerHr: 7.82 },
    { siteId: "111098", name: "EELPA Geraje", tankerCapacity: 2000, dgCapacity: 20, dgType: "COLIMO", genStandardFuelConsumptionPerHr: 5.1 },
    { siteId: "111104", name: "Gola Michael Extreme Hotel", tankerCapacity: 2000, dgCapacity: 30, dgType: "Pramac", genStandardFuelConsumptionPerHr: 7.82 },
    { siteId: "111108", name: "USA embassy", tankerCapacity: 2000, dgCapacity: 30, dgType: "SmartG", genStandardFuelConsumptionPerHr: 7.07 },
    { siteId: "111113", name: "Shola Gebeya", tankerCapacity: 2000, dgCapacity: 50, dgType: "JOHNDEER", genStandardFuelConsumptionPerHr: 9.384 },
    { siteId: "111119", name: "Karalo", tankerCapacity: 2000, dgCapacity: 30, dgType: "PRAMAC", genStandardFuelConsumptionPerHr: 7.82 },
    { siteId: "111133", name: "Meskel Flower School", tankerCapacity: 800, dgCapacity: 30, dgType: "sidmo", genStandardFuelConsumptionPerHr: 7.82 },
    { siteId: "111134", name: "Dreamliner Hotel", tankerCapacity: 800, dgCapacity: 20, dgType: "Mistubishi", genStandardFuelConsumptionPerHr: 5.1 },
    { siteId: "111137", name: "Olympia Admas College", tankerCapacity: 2000, dgCapacity: 40, dgType: "Pramac", genStandardFuelConsumptionPerHr: 12.512 },
    { siteId: "111138", name: "Saint Joseph School /PP Oromia", tankerCapacity: 500, dgCapacity: 40, dgType: "Pramac", genStandardFuelConsumptionPerHr: 12.512 },
    { siteId: "111139", name: "Back ECA/Salcost", tankerCapacity: 2000, dgCapacity: 40, dgType: "fmt", genStandardFuelConsumptionPerHr: 11.96 },
    { siteId: "111140", name: "Urael Haile Bldg", tankerCapacity: 2000, dgCapacity: 20, dgType: "Beinin", genStandardFuelConsumptionPerHr: 5.1 },
    { siteId: "111143", name: "Adowa Police Station", tankerCapacity: 2000, dgCapacity: 40, dgType: "ZND", genStandardFuelConsumptionPerHr: 7.82 },
    { siteId: "111145", name: "Sanforde School", tankerCapacity: 2000, dgCapacity: 30, dgType: "PRAMAC", genStandardFuelConsumptionPerHr: 7.82 },
    { siteId: "111148", name: "6 Killo Exchange gen1", tankerCapacity: 5000, dgCapacity: 300, dgType: "CUMMINS" },
    { siteId: "111148-2", name: "6 Killo Exchange gen2", tankerCapacity: 5000, dgCapacity: 300, dgType: "VOLVO" },
    { siteId: "111154", name: "In front MoFA", tankerCapacity: 2000, dgCapacity: 20, dgType: "Pramac", genStandardFuelConsumptionPerHr: 5.1 },
    { siteId: "111161", name: "Ferencay Tele", tankerCapacity: 3000, dgCapacity: 50, dgType: "JOHNDEER", genStandardFuelConsumptionPerHr: 8.487 },
    { siteId: "111168 old", name: "Kirkose exchange1", tankerCapacity: 12500, dgCapacity: 1500, dgType: "CUMMINS" },
    { siteId: "111168", name: "Kirkose exchange new", tankerCapacity: 12500, dgCapacity: 1500, dgType: "Lion Rock" },
    { siteId: "111200", name: "Israel garage", tankerCapacity: 2000, dgCapacity: 30, dgType: "Johndeere", genStandardFuelConsumptionPerHr: 7.82 },
    { siteId: "111201", name: "Abuware Selase", tankerCapacity: 3000, dgCapacity: 30, dgType: "SIDMO", genStandardFuelConsumptionPerHr: 7.82 },
    { siteId: "111204", name: "TMS School", tankerCapacity: 2000, dgCapacity: 30, dgType: "PRAMAC", genStandardFuelConsumptionPerHr: 7.82 },
    { siteId: "111207", name: "Ferncay Embasy Backe", tankerCapacity: 2000, dgCapacity: 30, dgType: "PRAMAC", genStandardFuelConsumptionPerHr: 7.82 },
    { siteId: "111217", name: "Gofa condo.", tankerCapacity: 2000, dgCapacity: 30, dgType: "PRAMAC", genStandardFuelConsumptionPerHr: 7.82 },
    { siteId: "111277", name: "22 akababi", tankerCapacity: 1000, dgCapacity: 15, dgType: "CUMMINS", genStandardFuelConsumptionPerHr: 4.49 },
    { siteId: "111278", name: "A,A,Univercity", tankerCapacity: 500, dgCapacity: 30, dgType: "PRAMAC", genStandardFuelConsumptionPerHr: 7.82 },
    { siteId: "111393", name: "CBE - mortgage building", tankerCapacity: 2000, dgCapacity: 20, dgType: "Beinin", genStandardFuelConsumptionPerHr: 4.6125 },
    { siteId: "111395", name: "Around Teklehaimanot", tankerCapacity: 1000, dgCapacity: 15, dgType: "Cummins", genStandardFuelConsumptionPerHr: 4.49 },
    { siteId: "111396", name: "National Hotel/Estifanos Church", tankerCapacity: 2000, dgCapacity: 40, dgType: "PRAMAC", genStandardFuelConsumptionPerHr: 7.82 },
    { siteId: "111398", name: "Kotebe Collge", tankerCapacity: 2000, dgCapacity: 30, dgType: "PRAMAC", genStandardFuelConsumptionPerHr: 7.82 },
    { siteId: "111402", name: "A,A,Univercity Dormitery", tankerCapacity: 3300, dgCapacity: 30, dgType: "PRAMAC", genStandardFuelConsumptionPerHr: 7.82 },
    { siteId: "111405", name: "Urael Bambis", tankerCapacity: 2000, dgCapacity: 30, dgType: "Pramac", genStandardFuelConsumptionPerHr: 7.82 },
    { siteId: "111411", name: "Filwuha Adarash", tankerCapacity: 3000, dgCapacity: 30, dgType: "Beinin/Mecca", genStandardFuelConsumptionPerHr: 7.07 },
    { siteId: "111417", name: "Kirkos wereha yekatit sch", tankerCapacity: 2000, dgCapacity: 30, dgType: "PRAMAC", genStandardFuelConsumptionPerHr: 7.82 },
    { siteId: "111420", name: "Piazza 3F", tankerCapacity: 1000, dgCapacity: 15, dgType: "Cummins", genStandardFuelConsumptionPerHr: 4.49 },
    { siteId: "111428", name: "Wendemamachoch School", tankerCapacity: 2000, dgCapacity: 20, dgType: "Mistubishi", genStandardFuelConsumptionPerHr: 5.1 },
    { siteId: "111435", name: "Kara Selase", tankerCapacity: 1000, dgCapacity: 30, dgType: "PRAMAC", genStandardFuelConsumptionPerHr: 7.82 },
    { siteId: "111439", name: "entoto repeater", tankerCapacity: 3000, dgCapacity: 30, dgType: "PRAMAC", genStandardFuelConsumptionPerHr: 7.82 },
    { siteId: "111440", name: "entoto waga bet", tankerCapacity: 2000, dgCapacity: 30, dgType: "PRAMAC", genStandardFuelConsumptionPerHr: 7.82 },
    { siteId: "111557", name: "Blacklion Hospital", tankerCapacity: 1000, dgCapacity: 15, dgType: "Cummins", genStandardFuelConsumptionPerHr: 4.49 },
    { siteId: "111598", name: "Selase College", tankerCapacity: 3000, dgCapacity: 30, dgType: "mecca", genStandardFuelConsumptionPerHr: 7.07 },
    { siteId: "111599", name: "Eyesuse Tesfay Daget", tankerCapacity: 3000, dgCapacity: 30, dgType: "mecca", genStandardFuelConsumptionPerHr: 7.07 },
    { siteId: "111600", name: "Italy embassy Tena station", tankerCapacity: 3000, dgCapacity: 30, dgType: "mecca", genStandardFuelConsumptionPerHr: 7.07 },
    { siteId: "111610", name: "Kotebe Kela Sefer", tankerCapacity: 3000, dgCapacity: 30, dgType: "mecca", genStandardFuelConsumptionPerHr: 7.07 },
    { siteId: "111613", name: "CMC", tankerCapacity: 500, dgCapacity: 30, dgType: "PRAMAC", genStandardFuelConsumptionPerHr: 7.82 },
    { siteId: "111617", name: "4 Killo Bikil tera", tankerCapacity: 3000, dgCapacity: 30, dgType: "mecca", genStandardFuelConsumptionPerHr: 7.07 },
    { siteId: "111618", name: "Legehar Gumuruk", tankerCapacity: 2000, dgCapacity: 20, dgType: "Beinin", genStandardFuelConsumptionPerHr: 4.6125 },
    { siteId: "111632", name: "METEBABER BLD.", tankerCapacity: 1000, dgCapacity: 15, dgType: "CUMMINS", genStandardFuelConsumptionPerHr: 4.49 },
    { siteId: "111635", name: "Russiya embassy", tankerCapacity: 3000, dgCapacity: 30, dgType: "mecca", genStandardFuelConsumptionPerHr: 7.07 },
    { siteId: "111643", name: "A,A TECHNO INST", tankerCapacity: 1000, dgCapacity: 15, dgType: "CUMMINS", genStandardFuelConsumptionPerHr: 4.49 },
    { siteId: "111652", name: "SHIRO MEDA GEBEYA", tankerCapacity: 1000, dgCapacity: 15, dgType: "CUMMINS", genStandardFuelConsumptionPerHr: 3.13 },
    { siteId: "111653", name: "6 kilo bussines collage", tankerCapacity: 1000, dgCapacity: 15, dgType: "CUMMINS", genStandardFuelConsumptionPerHr: 4.49 },
    { siteId: "111654", name: "EYESUS COND", tankerCapacity: 1000, dgCapacity: 15, dgType: "CUMMINS", genStandardFuelConsumptionPerHr: 4.49 },
    { siteId: "111659", name: "kotebe 02", tankerCapacity: 1000, dgCapacity: 15, dgType: "CUMMINS", genStandardFuelConsumptionPerHr: 4.49 },
    { siteId: "111665", name: "TSEHAY Chora SCH", tankerCapacity: 1000, dgCapacity: 15, dgType: "CUMMINS", genStandardFuelConsumptionPerHr: 3.13 },
    { siteId: "111667", name: "Shiromeda TVET", tankerCapacity: 1000, dgCapacity: 15, dgType: "CUMMINS", genStandardFuelConsumptionPerHr: 3.13 },
    { siteId: "111669", name: "Shola Bono sefer", tankerCapacity: 1000, dgCapacity: 15, dgType: "CUMMINS", genStandardFuelConsumptionPerHr: 4.49 },
    { siteId: "111670", name: "Debela Meda", tankerCapacity: 1000, dgCapacity: 15, dgType: "CUMMINS", genStandardFuelConsumptionPerHr: 3.13 },
    { siteId: "111678", name: "Bela Werda keble 02", tankerCapacity: 1000, dgCapacity: 15, dgType: "CUMMINS", genStandardFuelConsumptionPerHr: 3.13 },
    { siteId: "111679", name: "Ginfela Bridge", tankerCapacity: 1000, dgCapacity: 15, dgType: "CUMMINS", genStandardFuelConsumptionPerHr: 4.49 },
    { siteId: "111721", name: "Sinque Bank Kazanches", tankerCapacity: 1000, dgCapacity: 15, dgType: "Cummins", genStandardFuelConsumptionPerHr: 4.49 },
    { siteId: "111747", name: "Kazanches Libe Fana School", tankerCapacity: 1000, dgCapacity: 15, dgType: "Cummins", genStandardFuelConsumptionPerHr: 3.13 },
    { siteId: "111762", name: "Gulele Selase Churche", tankerCapacity: 1000, dgCapacity: 15, dgType: "CUMMINS", genStandardFuelConsumptionPerHr: 4.49 },
    { siteId: "111763", name: "Ferencay BONO WEHA", tankerCapacity: 1000, dgCapacity: 15, dgType: "CUMMINS", genStandardFuelConsumptionPerHr: 3.13 },
    { siteId: "111772", name: "Fersegna Gibi", tankerCapacity: 1000, dgCapacity: 15, dgType: "CUMMINS", genStandardFuelConsumptionPerHr: 4.49 },
    { siteId: "111849", name: "petrose hospital", tankerCapacity: 1000, dgCapacity: 15, dgType: "CUMMINS", genStandardFuelConsumptionPerHr: 3.13 },
    { siteId: "111855", name: "bella top hill", tankerCapacity: 1000, dgCapacity: 15, dgType: "CUMMINS", genStandardFuelConsumptionPerHr: 4.49 },
    { siteId: "111856", name: "abo eder", tankerCapacity: 1000, dgCapacity: 15, dgType: "CUMMINS", genStandardFuelConsumptionPerHr: 3.13 },
    { siteId: "111861", name: "Kenya  Embassy", tankerCapacity: 1000, dgCapacity: 15, dgType: "CUMMINS", genStandardFuelConsumptionPerHr: 4.49 },
    { siteId: "111862", name: "marathon moter", tankerCapacity: 3000, dgCapacity: 30, dgType: "mecca", genStandardFuelConsumptionPerHr: 7.07 },
    { siteId: "111867", name: "Inside 7th day adve school", tankerCapacity: 1000, dgCapacity: 15, dgType: "CUMMINS", genStandardFuelConsumptionPerHr: 3.13 },
    { siteId: "111873", name: "akako mena", tankerCapacity: 1000, dgCapacity: 15, dgType: "CUMMINS", genStandardFuelConsumptionPerHr: 3.13 },
    { siteId: "111876", name: "hamele 19", tankerCapacity: 500, dgCapacity: 30, dgType: "PRAMAC", genStandardFuelConsumptionPerHr: 7.82 },
    { siteId: "112071", name: "TPO", tankerCapacity: 3000, dgCapacity: 125, dgType: "Sdmo" },
    { siteId: "112072", name: "Sheraton Mosque", tankerCapacity: 1000, dgCapacity: 15, dgType: "Cummins", genStandardFuelConsumptionPerHr: 4.49 },
    { siteId: "112074", name: "Feres meda health center", tankerCapacity: 1000, dgCapacity: 15, dgType: "CUMMINS", genStandardFuelConsumptionPerHr: 3.13 },
    { siteId: "112077", name: "Beal bldg kera", tankerCapacity: 1000, dgCapacity: 15, dgType: "CUMMINS", genStandardFuelConsumptionPerHr: 3.13 },
    { siteId: "112078", name: "Ethiopian Civil Service Commission", tankerCapacity: 1000, dgCapacity: 15, dgType: "Cummins", genStandardFuelConsumptionPerHr: 4.49 },
    { siteId: "112079", name: "Monaliza", tankerCapacity: 3000, dgCapacity: 30, dgType: "mecca", genStandardFuelConsumptionPerHr: 7.07 },
    { siteId: "112082", name: "Kidistemariyam", tankerCapacity: 1000, dgCapacity: 15, dgType: "CUMMINS", genStandardFuelConsumptionPerHr: 4.49 },
    { siteId: "112085", name: "Delux Furniture", tankerCapacity: 1000, dgCapacity: 15, dgType: "Cummins", genStandardFuelConsumptionPerHr: 4.49 },
    { siteId: "112090", name: "Mesualekia Shoa Dabo", tankerCapacity: 1000, dgCapacity: 15, dgType: "Cummins", genStandardFuelConsumptionPerHr: 3.13 },
    { siteId: "112092", name: "Shemlis Habte School", tankerCapacity: 1000, dgCapacity: 15, dgType: "Cummins", genStandardFuelConsumptionPerHr: 4.49 },
    { siteId: "112095", name: "Betich Agency Bambis", tankerCapacity: 1000, dgCapacity: 15, dgType: "Cummins", genStandardFuelConsumptionPerHr: 4.49 },
    { siteId: "112096", name: "Meles Foundation", tankerCapacity: 1000, dgCapacity: 15, dgType: "Cummins", genStandardFuelConsumptionPerHr: 3.13 },
    { siteId: "112100", name: "GETAS", tankerCapacity: 1000, dgCapacity: 15, dgType: "Cummins", genStandardFuelConsumptionPerHr: 4.49 },
    { siteId: "112110", name: "Negat Kokeb School", tankerCapacity: 3000, dgCapacity: 30, dgType: "Beinin/Mecca", genStandardFuelConsumptionPerHr: 7.07 },
    { siteId: "112111", name: "Ehel megazene", tankerCapacity: 3000, dgCapacity: 30, dgType: "mecca", genStandardFuelConsumptionPerHr: 7.07 },
    { siteId: "112118", name: "Gola Michael Health Center", tankerCapacity: 1000, dgCapacity: 15, dgType: "Cummins", genStandardFuelConsumptionPerHr: 4.49 },
    { siteId: "112124", name: "Kazanches Enderasie", tankerCapacity: 1000, dgCapacity: 15, dgType: "Cummins", genStandardFuelConsumptionPerHr: 3.13 },
    { siteId: "112126", name: "Niri Minche", tankerCapacity: 1000, dgCapacity: 15, dgType: "CUMMINS", genStandardFuelConsumptionPerHr: 4.49 },
    { siteId: "112136", name: "Amanuhel Gedame", tankerCapacity: 1000, dgCapacity: 15, dgType: "CUMMINS", genStandardFuelConsumptionPerHr: 4.49 },
    { siteId: "112138", name: "Minilik Seco. school", tankerCapacity: 1000, dgCapacity: 15, dgType: "CUMMINS", genStandardFuelConsumptionPerHr: 4.49 },
    { siteId: "112139", name: "CETU building", tankerCapacity: 1000, dgCapacity: 15, dgType: "Cummins", genStandardFuelConsumptionPerHr: 4.49 },
    { siteId: "112140", name: "Abuare Edina Hotel", tankerCapacity: 3000, dgCapacity: 30, dgType: "Beinin/Mecca", genStandardFuelConsumptionPerHr: 7.07 },
    { siteId: "112143", name: "Gurara Chaf", tankerCapacity: 1000, dgCapacity: 15, dgType: "CUMMINS", genStandardFuelConsumptionPerHr: 3.13 },
    { siteId: "112153", name: "ankorecha", tankerCapacity: 1000, dgCapacity: 15, dgType: "CUMMINS", genStandardFuelConsumptionPerHr: 3.13 },
    { siteId: "112154", name: "ankorecha", tankerCapacity: 1000, dgCapacity: 15, dgType: "CUMMINS", genStandardFuelConsumptionPerHr: 3.13 },
    { siteId: "112155", name: "Hana Mariyam Churche", tankerCapacity: 1000, dgCapacity: 15, dgType: "CUMMINS", genStandardFuelConsumptionPerHr: 4.49 },
    { siteId: "112160", name: "Entoto Kidanmert", tankerCapacity: 1000, dgCapacity: 15, dgType: "CUMMINS", genStandardFuelConsumptionPerHr: 3.13 },
    { siteId: "112161", name: "Ankorcha Sefer", tankerCapacity: 1000, dgCapacity: 15, dgType: "CUMMINS", genStandardFuelConsumptionPerHr: 4.49 },
    { siteId: "112168", name: "Coffe & Tea building", tankerCapacity: 1000, dgCapacity: 15, dgType: "Cummins", genStandardFuelConsumptionPerHr: 4.49 },
    { siteId: "112178", name: "bekenek Ankorcha", tankerCapacity: 1000, dgCapacity: 15, dgType: "CUMMINS", genStandardFuelConsumptionPerHr: 3.13 },
    { siteId: "112194", name: "Ajebe Terara", tankerCapacity: 1000, dgCapacity: 15, dgType: "CUMMINS", genStandardFuelConsumptionPerHr: 4.49 },
    { siteId: "112195", name: "Ankorcha", tankerCapacity: 1000, dgCapacity: 15, dgType: "CUMMINS", genStandardFuelConsumptionPerHr: 4.49 },
    { siteId: "112196", name: "serdi", tankerCapacity: 1000, dgCapacity: 15, dgType: "CUMMINS", genStandardFuelConsumptionPerHr: 3.13 },
    { siteId: "112201", name: "lancha concord hotel beside", tankerCapacity: 1000, dgCapacity: 15, dgType: "CUMMINS", genStandardFuelConsumptionPerHr: 3.13 },
    { siteId: "112204", name: "akako mena", tankerCapacity: 1000, dgCapacity: 15, dgType: "CUMMINS", genStandardFuelConsumptionPerHr: 3.13 },
    { siteId: "112205", name: "Ferensay BIRET DILDY", tankerCapacity: 1000, dgCapacity: 15, dgType: "CUMMINS", genStandardFuelConsumptionPerHr: 3.13 },
    { siteId: "112223", name: "Akako mena abchu", tankerCapacity: 1000, dgCapacity: 15, dgType: "CUMMINS", genStandardFuelConsumptionPerHr: 3.13 },
    { siteId: "112232", name: "welo sefer", tankerCapacity: 2000, dgCapacity: 30, dgType: "ZTE", genStandardFuelConsumptionPerHr: 7.07 },
    { siteId: "112303", name: "Tele Garage", tankerCapacity: 2000, dgCapacity: 125, dgType: "CUMMINS", genStandardFuelConsumptionPerHr: 12.512 },
    { siteId: "113007", name: "Wesen near to michael church", tankerCapacity: 3000, dgCapacity: 30, dgType: "mecca", genStandardFuelConsumptionPerHr: 7.07 },
    { siteId: "113037", name: "gotera condomminum", tankerCapacity: 2000, dgCapacity: 40, dgType: "PRAMAC", genStandardFuelConsumptionPerHr: 7.82 },
    { siteId: "113044", name: "Inside Catholic Church signal", tankerCapacity: 1000, dgCapacity: 15, dgType: "CUMMINS", genStandardFuelConsumptionPerHr: 4.49 },
    { siteId: "113065", name: "Ethiopian space science Entoto", tankerCapacity: 2000, dgCapacity: 30, dgType: "PRAMAC", genStandardFuelConsumptionPerHr: 6.26 },
    { siteId: "113066", name: "41 Eyesus Mechael church", tankerCapacity: 2000, dgCapacity: 30, dgType: "PRAMAC", genStandardFuelConsumptionPerHr: 6.26 },
    { siteId: "113082", name: "shenkuru michael", tankerCapacity: 2000, dgCapacity: 30, dgType: "mecca", genStandardFuelConsumptionPerHr: 7.07 },
    { siteId: "113207", name: "Entoto park near main gate", tankerCapacity: 1000, dgCapacity: 15, dgType: "CUMMINS", genStandardFuelConsumptionPerHr: 3.13 },
    { siteId: "113432", name: "chaka project", tankerCapacity: 2000, dgCapacity: 30, dgType: "Smartg", genStandardFuelConsumptionPerHr: 7.07 },
    { siteId: "113751", name: "betmengeset", tankerCapacity: 2000, dgCapacity: 30, dgType: "pRAMAC", genStandardFuelConsumptionPerHr: 7.82 },
    { siteId: "ET-001", name: "Portable Dg on NPR", tankerCapacity: 500, dgCapacity: 30, dgType: "GREEN POWER", genStandardFuelConsumptionPerHr: 7.82 },
    { siteId: "ET-002", name: "CAAZ Zonal Office", tankerCapacity: 2000, dgCapacity: 75, dgType: "pRAMAC" },
    { siteId: "ET-003", name: "Head Office Denbel", tankerCapacity: 3000, dgCapacity: 800, dgType: "perkins" },
    { siteId: "ET-004", name: "Portable Dg on Old HQ", tankerCapacity: 500, dgCapacity: 125, dgType: "Perkins" }
];

async function main() {
    console.log('Starting NAAR region seed (optimized for Neon)...');

    // 1. Ensure Regions exist (batch all upserts in a transaction)
    const AA_REGIONS = ['CNR', 'NER', 'NAAR', 'EAAR', 'WAAR', 'SAAR', 'SWAAR'];
    const OUTSIDE_REGIONS = ['SWWR', 'SWR', 'EER', 'WWR', 'NEER', 'NWR', 'WR', 'NR', 'CER', 'SSWR', 'ER', 'CWR', 'SR', 'SER', 'NNWR', 'SSER'];
    const ALL_REGIONS = [...AA_REGIONS, ...OUTSIDE_REGIONS];

    const regionOps = ALL_REGIONS.map(name =>
        prisma.region.upsert({ where: { name }, update: {}, create: { name } })
    );
    const regions = await prisma.$transaction(regionOps);
    const regionMap = {};
    ALL_REGIONS.forEach((name, i) => { regionMap[name] = regions[i].id; });
    console.log(`Regions ensured: ${regions.length} regions.`);

    const naarRegionId = regionMap['NAAR'];

    // 2. Seed Sites in batches of 20 (using $transaction)
    const BATCH_SIZE = 20;
    let siteCount = 0;
    let genCount = 0;

    for (let b = 0; b < naarData.length; b += BATCH_SIZE) {
        const batch = naarData.slice(b, b + BATCH_SIZE);
        const siteOps = batch.map(item =>
            prisma.site.upsert({
                where: { siteId: item.siteId },
                update: {
                    name: item.name,
                    tankerCapacity: item.tankerCapacity,
                    dgCapacity: String(item.dgCapacity || ''),
                    dgType: item.dgType || '',
                    regionId: naarRegionId,
                    region: 'NAAR',
                },
                create: {
                    siteId: item.siteId,
                    name: item.name,
                    tankerCapacity: item.tankerCapacity,
                    dgCapacity: String(item.dgCapacity || ''),
                    dgType: item.dgType || '',
                    regionId: naarRegionId,
                    region: 'NAAR',
                    gpsCoordinates: `9.${Math.floor(Math.random() * 100)}, 38.${Math.floor(Math.random() * 100)}`,
                    installationDate: new Date('2022-01-01')
                }
            })
        );
        const sites = await prisma.$transaction(siteOps);
        siteCount += sites.length;
        console.log(`  Sites batch ${Math.floor(b / BATCH_SIZE) + 1}: ${sites.length} sites upserted.`);

        // 3. Generators for this batch (in a transaction)
        const genOps = batch.map((item, i) => {
            const genId = `GEN-${item.siteId}`;
            return prisma.generator.upsert({
                where: { genId },
                update: {
                    model: item.dgType || 'Unknown',
                    capacity: String(item.dgCapacity || ''),
                    stdFuelConsumption: item.genStandardFuelConsumptionPerHr || 0,
                },
                create: {
                    genId,
                    model: item.dgType || 'Unknown',
                    capacity: String(item.dgCapacity || ''),
                    stdFuelConsumption: item.genStandardFuelConsumptionPerHr || 0,
                    siteId: sites[i].id,
                    serialNumber: `SN-${item.siteId}-${Math.floor(Math.random() * 1000)}`,
                    installationDate: new Date('2022-02-01')
                }
            });
        });
        const gens = await prisma.$transaction(genOps);
        genCount += gens.length;
        console.log(`  Generators batch ${Math.floor(b / BATCH_SIZE) + 1}: ${gens.length} generators upserted.`);

        // 4. Fuel Refills for this batch (batched create)
        const refillOps = [];
        for (let i = 0; i < sites.length; i++) {
            const numRefills = Math.floor(Math.random() * 3) + 1;
            for (let r = 0; r < numRefills; r++) {
                const refillDate = new Date();
                refillDate.setMonth(refillDate.getMonth() - Math.floor(Math.random() * 6));
                refillDate.setDate(Math.floor(Math.random() * 28) + 1);
                const fuelDelivered = Math.floor(Math.random() * 1000) + 200;
                const beforeLevel = Math.floor(Math.random() * 500);
                refillOps.push(
                    prisma.fuelRefill.create({
                        data: {
                            siteId: sites[i].id,
                            refillDate,
                            fuelDelivered,
                            beforeLevel,
                            afterLevel: beforeLevel + fuelDelivered,
                            beforeHours: Math.floor(Math.random() * 5000) + 100,
                            afterHours: Math.floor(Math.random() * 5000) + 100 + Math.floor(Math.random() * 24),
                            tankerVehicle: "T-8876",
                            driverName: "Abebe Driver",
                        }
                    })
                );
            }
        }
        if (refillOps.length > 0) {
            await prisma.$transaction(refillOps);
            console.log(`  Refills batch ${Math.floor(b / BATCH_SIZE) + 1}: ${refillOps.length} refills created.`);
        }
    }

    console.log(`\nSeed complete! Seeded ${siteCount} sites and ${genCount} generators for NAAR region.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
