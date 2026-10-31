import { State as CSCState, City as CSCCity } from "country-state-city";

/**
 * Comprehensive Statutory Registry of Indian States, Union Territories,
 * Official Administrative Districts & Municipalities powered by `country-state-city` npm package.
 */

export interface StateDistrictMap {
  state: string;
  code: string;
  type: "STATE" | "UT";
  districts: string[];
}

export const INDIA_GEO_DATA: StateDistrictMap[] = [
  {
    state: "Andhra Pradesh",
    code: "AP",
    type: "STATE",
    districts: [
      "Alluri Sitharama Raju", "Anakapalli", "Ananthapuramu", "Annamayya",
      "Bapatla", "Chittoor", "Dr. B.R. Ambedkar Konaseema", "East Godavari",
      "Eluru", "Guntur", "Kakinada", "Krishna", "Kurnool", "Nandyal",
      "NTR", "Palnadu", "Parvathipuram Manyam", "Prakasam", "Srikakulam",
      "Sri Potti Sriramulu Nellore", "Sri Sathya Sai", "Tirupati",
      "Visakhapatnam", "Vizianagaram", "West Godavari", "YSR Kadapa"
    ],
  },
  {
    state: "Arunachal Pradesh",
    code: "AR",
    type: "STATE",
    districts: [
      "Anjaw", "Changlang", "Dibang Valley", "East Kameng", "East Siang",
      "Kamle", "Kra Daadi", "Kurung Kumey", "Lepa Rada", "Lohit", "Longding",
      "Lower Dibang Valley", "Lower Siang", "Lower Subansiri", "Namsai",
      "Pakke Kessang", "Papum Pare", "Shi Yomi", "Siang", "Tawang",
      "Tirap", "Upper Siang", "Upper Subansiri", "West Kameng", "West Siang"
    ],
  },
  {
    state: "Assam",
    code: "AS",
    type: "STATE",
    districts: [
      "Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar", "Charaideo",
      "Chirang", "Darrang", "Dhemaji", "Dhubri", "Dibrugarh", "Dima Hasao",
      "Goalpara", "Golaghat", "Hailakandi", "Hojai", "Jorhat", "Kamrup",
      "Kamrup Metropolitan", "Karbi Anglong", "Karimganj", "Kokrajhar",
      "Lakhimpur", "Majuli", "Morigaon", "Nagaon", "Nalbari", "Sivasagar",
      "Sonitpur", "South Salmara-Mankachar", "Tinsukia", "Udalguri", "West Karbi Anglong"
    ],
  },
  {
    state: "Bihar",
    code: "BR",
    type: "STATE",
    districts: [
      "Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur",
      "Bhojpur", "Buxar", "Darbhanga", "East Champaran", "Gaya", "Gopalganj",
      "Jamui", "Jehanabad", "Kaimur", "Katihar", "Khagaria", "Kishanganj",
      "Lakhisarai", "Madhepura", "Madhubani", "Munger", "Muzaffarpur",
      "Nalanda", "Nawada", "Patna", "Purnia", "Rohtas", "Saharsa",
      "Samastipur", "Saran", "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan",
      "Supaul", "Vaishali", "West Champaran"
    ],
  },
  {
    state: "Chhattisgarh",
    code: "CG",
    type: "STATE",
    districts: [
      "Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara", "Bijapur",
      "Bilaspur", "Dantewada", "Dhamtari", "Durg", "Gariaband", "Gaurela-Pendra-Marwahi",
      "Janjgir-Champa", "Jashpur", "Kabirdham", "Kanker", "Khairagarh-Chhuikhadan-Gandai",
      "Kondagaon", "Korba", "Koriya", "Mahasamund", "Manendragarh-Chirmiri-Bharatpur",
      "Mohla-Manpur-Ambagarh Chowki", "Mungeli", "Narayanpur", "Raigarh",
      "Raipur", "Rajnandgaon", "Sarangarh-Bilaigarh", "Sakti", "Sukma",
      "Surajpur", "Surguja"
    ],
  },
  {
    state: "Goa",
    code: "GA",
    type: "STATE",
    districts: ["North Goa", "South Goa"],
  },
  {
    state: "Gujarat",
    code: "GJ",
    type: "STATE",
    districts: [
      "Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha", "Bharuch",
      "Bhavnagar", "Botad", "Chhota Udaipur", "Dahod", "Dang", "Devbhoomi Dwarka",
      "Gandhinagar", "Gir Somnath", "Jamnagar", "Junagadh", "Kheda", "Kutch",
      "Mahisagar", "Mehsana", "Morbi", "Narmada", "Navsari", "Panchmahal",
      "Patan", "Porbandar", "Rajkot", "Sabarkantha", "Surat", "Surendranagar",
      "Tapi", "Vadodara", "Valsad"
    ],
  },
  {
    state: "Haryana",
    code: "HR",
    type: "STATE",
    districts: [
      "Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad", "Gurugram",
      "Hisar", "Jhajjar", "Jind", "Kaithal", "Karnal", "Kurukshetra", "Mahendragarh",
      "Nuh", "Palwal", "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa",
      "Sonipat", "Yamunanagar"
    ],
  },
  {
    state: "Himachal Pradesh",
    code: "HP",
    type: "STATE",
    districts: [
      "Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu",
      "Lahaul and Spiti", "Mandi", "Shimla", "Sirmaur", "Solan", "Una"
    ],
  },
  {
    state: "Jharkhand",
    code: "JH",
    type: "STATE",
    districts: [
      "Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum",
      "Garhwa", "Giridih", "Godda", "Gumla", "Hazaribagh", "Jamtara",
      "Khunti", "Koderma", "Latehar", "Lohardaga", "Pakur", "Palamu",
      "Ramgarh", "Ranchi", "Sahebganj", "Seraikela Kharsawan", "Simdega",
      "West Singhbhum"
    ],
  },
  {
    state: "Karnataka",
    code: "KA",
    type: "STATE",
    districts: [
      "Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban",
      "Bidar", "Chamarajanagar", "Chikkaballapura", "Chikkamagaluru", "Chitradurga",
      "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Hassan",
      "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal", "Mandya",
      "Mysuru", "Raichur", "Ramanagara", "Shivamogga", "Tumakuru", "Udupi",
      "Uttara Kannada", "Vijayanagara", "Vijayapura", "Yadgir"
    ],
  },
  {
    state: "Kerala",
    code: "KL",
    type: "STATE",
    districts: [
      "Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam",
      "Kottayam", "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta",
      "Thiruvananthapuram", "Thrissur", "Wayanad"
    ],
  },
  {
    state: "Madhya Pradesh",
    code: "MP",
    type: "STATE",
    districts: [
      "Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat", "Barwani",
      "Betul", "Bhind", "Bhopal", "Burhanpur", "Chhatarpur", "Chhindwara",
      "Damoh", "Datia", "Dewas", "Dhar", "Dindori", "Guna", "Gwalior",
      "Harda", "Hoshangabad", "Indore", "Jabalpur", "Jhabua", "Katni",
      "Khandwa", "Khargone", "Mandla", "Mandsaur", "Morena", "Narsinghpur",
      "Neemuch", "Niwari", "Panna", "Raisen", "Rajgarh", "Ratlam",
      "Rewa", "Sagar", "Satna", "Sehore", "Seoni", "Shahdol", "Shajapur",
      "Sheopur", "Shivpuri", "Sidhi", "Singrauli", "Tikamgarh", "Ujjain",
      "Umaria", "Vidisha"
    ],
  },
  {
    state: "Maharashtra",
    code: "MH",
    type: "STATE",
    districts: [
      "Ahmednagar", "Akola", "Amravati", "Chhatrapati Sambhajinagar", "Beed",
      "Bhandara", "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia",
      "Hingoli", "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City",
      "Mumbai Suburban", "Nagpur", "Nanded", "Nandurbar", "Nashik", "Dharashiv",
      "Palghar", "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli",
      "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"
    ],
  },
  {
    state: "Manipur",
    code: "MN",
    type: "STATE",
    districts: [
      "Bishnupur", "Chandel", "Churachandpur", "Imphal East", "Imphal West",
      "Jiribam", "Kakching", "Kamjong", "Kangpokpi", "Noney", "Pherzawl",
      "Senapati", "Tamenglong", "Tengnoupal", "Thoubal", "Ukhrul"
    ],
  },
  {
    state: "Meghalaya",
    code: "ML",
    type: "STATE",
    districts: [
      "Eastern West Khasi Hills", "East Garo Hills", "East Jaintia Hills",
      "East Khasi Hills", "North Garo Hills", "Ri Bhoi", "South Garo Hills",
      "South West Garo Hills", "South West Khasi Hills", "West Garo Hills",
      "West Jaintia Hills", "West Khasi Hills"
    ],
  },
  {
    state: "Mizoram",
    code: "MZ",
    type: "STATE",
    districts: [
      "Aizawl", "Champhai", "Hnahthial", "Khawzawl", "Kolasib", "Lawngtlai",
      "Lunglei", "Mamit", "Saitual", "Serchhip", "Siaha"
    ],
  },
  {
    state: "Nagaland",
    code: "NL",
    type: "STATE",
    districts: [
      "Chumoukedima", "Dimapur", "Kiphire", "Kohima", "Longleng", "Mokokchung",
      "Mon", "Niuland", "Noklak", "Peren", "Phek", "Shamator", "Tseminyu",
      "Tuensang", "Wokha", "Zunheboto"
    ],
  },
  {
    state: "Odisha",
    code: "OD",
    type: "STATE",
    districts: [
      "Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak", "Boudh",
      "Cuttack", "Deogarh", "Dhenkanal", "Gajapati", "Ganjam", "Jagatsinghpur",
      "Jajpur", "Jharsuguda", "Kalahandi", "Kandhamal", "Kendrapara",
      "Kendujhar", "Khordha", "Koraput", "Malkangiri", "Mayurbhanj",
      "Nabarangpur", "Nayagarh", "Nuapada", "Puri", "Rayagada",
      "Sambalpur", "Subarnapur", "Sundargarh"
    ],
  },
  {
    state: "Punjab",
    code: "PB",
    type: "STATE",
    districts: [
      "Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib",
      "Fazilka", "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar",
      "Kapurthala", "Ludhiana", "Malerkotla", "Mansa", "Moga", "Muktsar",
      "Pathankot", "Patiala", "Rupnagar", "Sahibzada Ajit Singh Nagar",
      "Shaheed Bhagat Singh Nagar", "Sangrur", "Tarn Taran"
    ],
  },
  {
    state: "Rajasthan",
    code: "RJ",
    type: "STATE",
    districts: [
      "Ajmer", "Alwar", "Anupgarh", "Balotra", "Banswara", "Baran", "Barmer",
      "Beawar", "Bharatpur", "Bhilwara", "Bikaner", "Bundi", "Chittorgarh",
      "Churu", "Dausa", "Deeg", "Dholpur", "Didwana-Kuchaman", "Dudu",
      "Dungarpur", "Ganganagar", "Gangapur City", "Hanumangarh", "Jaipur",
      "Jaipur Rural", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu", "Jodhpur",
      "Jodhpur Rural", "Karauli", "Kekri", "Khairthal-Tijara", "Kota", "Kotputli-Behror",
      "Nagaur", "Neem Ka Thana", "Pali", "Phalodi", "Pratapgarh", "Rajsamand",
      "Salumbar", "Sanchore", "Sawai Madhopur", "Shahpura", "Sikar", "Sirohi",
      "Tonk", "Udaipur"
    ],
  },
  {
    state: "Sikkim",
    code: "SK",
    type: "STATE",
    districts: ["Gangtok", "Gyalshing", "Mangan", "Namchi", "Pakyong", "Soreng"],
  },
  {
    state: "Tamil Nadu",
    code: "TN",
    type: "STATE",
    districts: [
      "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore",
      "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kanchipuram",
      "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai",
      "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai",
      "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi",
      "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli",
      "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur",
      "Vellore", "Viluppuram", "Virudhunagar"
    ],
  },
  {
    state: "Telangana",
    code: "TG",
    type: "STATE",
    districts: [
      "Adilabad", "Bhadradri Kothagudem", "Hanamkonda", "Hyderabad",
      "Jagtial", "Jangaon", "Jayashankar Bhupalpally", "Jogulamba Gadwal",
      "Kamareddy", "Karimnagar", "Khammam", "Kumuram Bheem Asifabad",
      "Mahabubabad", "Mahabubnagar", "Mancherial", "Medak", "Medchal-Malkajgiri",
      "Mulugu", "Nagarkurnool", "Nalgonda", "Narayanpet", "Nirmal",
      "Nizamabad", "Peddapalli", "Rajanna Sircilla", "Rangareddy",
      "Sangareddy", "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy",
      "Warangal", "Yadadri Bhuvanagiri"
    ],
  },
  {
    state: "Tripura",
    code: "TR",
    type: "STATE",
    districts: [
      "Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala",
      "South Tripura", "Unakoti", "West Tripura"
    ],
  },
  {
    state: "Uttar Pradesh",
    code: "UP",
    type: "STATE",
    districts: [
      "Agra", "Aligarh", "Ambedkar Nagar", "Amethi", "Amroha", "Auraiya",
      "Ayodhya", "Azamgarh", "Baghpat", "Bahraich", "Ballia", "Balrampur",
      "Banda", "Barabanki", "Bareilly", "Basti", "Bhadohi", "Bijnor",
      "Budaun", "Bulandshahr", "Chandauli", "Chitrakoot", "Deoria", "Etah",
      "Etawah", "Farrukhabad", "Fatehpur", "Firozabad", "Gautam Buddha Nagar",
      "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur", "Hapur",
      "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi", "Kannauj",
      "Kanpur Dehat", "Kanpur Nagar", "Kasganj", "Kaushambi", "Kheri",
      "Kushinagar", "Lalitpur", "Lucknow", "Maharajganj", "Mahoba",
      "Mainpuri", "Mathura", "Mau", "Meerut", "Mirzapur", "Moradabad",
      "Muzaffarnagar", "Pilibhit", "Pratapgarh", "Prayagraj", "Raebareli",
      "Rampur", "Saharanpur", "Sambhal", "Sant Kabir Nagar", "Shahjahanpur",
      "Shamli", "Shravasti", "Siddharthnagar", "Sitapur", "Sonbhadra",
      "Sultanpur", "Unnao", "Varanasi"
    ],
  },
  {
    state: "Uttarakhand",
    code: "UK",
    type: "STATE",
    districts: [
      "Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun",
      "Haridwar", "Nainital", "Pauri Garhwal", "Pithoragarh",
      "Rudraprayag", "Tehri Garhwal", "Udham Singh Nagar", "Uttarkashi"
    ],
  },
  {
    state: "West Bengal",
    code: "WB",
    type: "STATE",
    districts: [
      "Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur",
      "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri", "Jhargram",
      "Kalimpong", "Kolkata", "Malda", "Murshidabad", "Nadia",
      "North 24 Parganas", "Paschim Bardhaman", "Paschim Medinipur",
      "Purba Bardhaman", "Purba Medinipur", "Purulia", "South 24 Parganas",
      "Uttar Dinajpur"
    ],
  },
  // ── UNION TERRITORIES ──
  {
    state: "Andaman and Nicobar Islands",
    code: "AN",
    type: "UT",
    districts: ["Nicobar", "North and Middle Andaman", "South Andaman"],
  },
  {
    state: "Chandigarh",
    code: "CH",
    type: "UT",
    districts: ["Chandigarh"],
  },
  {
    state: "Dadra and Nagar Haveli and Daman and Diu",
    code: "DN",
    type: "UT",
    districts: ["Dadra and Nagar Haveli", "Daman", "Diu"],
  },
  {
    state: "Delhi",
    code: "DL",
    type: "UT",
    districts: [
      "Central Delhi", "East Delhi", "New Delhi", "North Delhi",
      "North East Delhi", "North West Delhi", "Shahdara", "South Delhi",
      "South East Delhi", "South West Delhi", "West Delhi"
    ],
  },
  {
    state: "Jammu and Kashmir",
    code: "JK",
    type: "UT",
    districts: [
      "Anantnag", "Bandipora", "Baramulla", "Budgam", "Doda", "Ganderbal",
      "Jammu", "Kathua", "Kishtwar", "Kulgam", "Kupwara", "Poonch",
      "Pulwama", "Rajouri", "Ramban", "Reasi", "Samba", "Shopian",
      "Srinagar", "Udhampur"
    ],
  },
  {
    state: "Ladakh",
    code: "LA",
    type: "UT",
    districts: ["Kargil", "Leh"],
  },
  {
    state: "Lakshadweep",
    code: "LD",
    type: "UT",
    districts: ["Lakshadweep"],
  },
  {
    state: "Puducherry",
    code: "PY",
    type: "UT",
    districts: ["Karaikal", "Mahe", "Puducherry", "Yanam"],
  },
];

/**
 * Returns sorted list of all Indian States and Union Territories.
 * Synchronized with official ISO-3166-2:IN codes from country-state-city.
 */
export function getAllStates(): string[] {
  const cscStates = CSCState.getStatesOfCountry("IN").map((s) => s.name);
  if (cscStates.length > 0) {
    return cscStates.sort((a, b) => a.localeCompare(b));
  }
  return INDIA_GEO_DATA.map((s) => s.state).sort((a, b) => a.localeCompare(b));
}

/**
 * Returns the ISO state code (e.g., 'TN' for Tamil Nadu, 'DL' for Delhi)
 */
export function getStateCode(stateName: string): string | undefined {
  if (!stateName) return undefined;
  const normalized = stateName.trim().toLowerCase();
  const cscMatch = CSCState.getStatesOfCountry("IN").find(
    (s) => s.name.toLowerCase() === normalized || s.isoCode.toLowerCase() === normalized
  );
  if (cscMatch) return cscMatch.isoCode;
  const staticMatch = INDIA_GEO_DATA.find((s) => s.state.toLowerCase() === normalized);
  return staticMatch?.code;
}

/**
 * Returns all official districts for a specified State or Union Territory.
 * Case-insensitive match.
 */
export function getDistrictsByState(stateName: string): string[] {
  if (!stateName) return [];
  const normalized = stateName.trim().toLowerCase();
  const found = INDIA_GEO_DATA.find(
    (s) => s.state.toLowerCase() === normalized
  );
  if (found) {
    return [...found.districts].sort((a, b) => a.localeCompare(b));
  }
  // Fallback: if not in static list, check country-state-city cities as regional units
  const stateCode = getStateCode(stateName);
  if (stateCode) {
    const cscCities = CSCCity.getCitiesOfState("IN", stateCode).map((c) => c.name);
    return Array.from(new Set(cscCities)).sort((a, b) => a.localeCompare(b));
  }
  return [];
}

/**
 * Returns municipal cities and towns for a specified State from the `country-state-city` package.
 */
export function getCitiesByState(stateName: string): string[] {
  if (!stateName) return [];
  const stateCode = getStateCode(stateName);
  if (!stateCode) return [];
  const cities = CSCCity.getCitiesOfState("IN", stateCode).map((c) => c.name);
  return Array.from(new Set(cities)).sort((a, b) => a.localeCompare(b));
}

/**
 * Validates a standard 6-digit Indian Postal Identification Number (PIN code).
 * Strictly conforms to: Cannot begin with 0, must be 6 digits.
 */
export function validatePincode(pincode: string): boolean {
  return /^[1-9][0-9]{5}$/.test(pincode.trim());
}

/**
 * Validates a 10-digit Indian Mobile number.
 * Standard Indian numbering plan: starts with 6, 7, 8, or 9 and has 10 digits.
 */
export function validateIndianMobile(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  // Accept standard 10 digit, or 12 digit with leading 91
  if (digits.length === 10) {
    return /^[6-9]\d{9}$/.test(digits);
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    return /^[6-9]\d{9}$/.test(digits.slice(2));
  }
  return false;
}

/**
 * Formats a raw 10-digit phone number as standard +91 XXXXX-XXXXX
 */
export function formatIndianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const nationalNumber = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
  if (nationalNumber.length <= 5) {
    return nationalNumber ? `+91 ${nationalNumber}` : "";
  }
  return `+91 ${nationalNumber.slice(0, 5)}-${nationalNumber.slice(5, 10)}`;
}

