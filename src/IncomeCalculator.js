import React, { useState, useEffect } from 'react';
import './IncomeCalculator.css';

const InvestmentProfiles = {
    'Spaarrekening': 0.005,
    'Defensief': 0.03,
    'Gematigd defensief': 0.04,
    'Neutraal': 0.05,
    'Offensief': 0.07,
    'Zeer offensief': 0.08
};

function IncomePreservationCalculator({ onNavigate, onLogout }) {
            // Step management
            const [currentStep, setCurrentStep] = useState(0);

            // Personal information (Step 0)
            const [name, setName] = useState('');
            const [birthDate, setBirthDate] = useState('');
            const [aowAge, setAowAge] = useState(null);
            const [aowDate, setAowDate] = useState(null);
            const [ageAtWithdrawal, setAgeAtWithdrawal] = useState(null);

            // Build-up period inputs
            const [buildUpProfile, setBuildUpProfile] = useState('Defensief');
            const [period, setPeriod] = useState('');
            const [periodicDeposit, setPeriodicDeposit] = useState('');
            const [lumpSum, setLumpSum] = useState('');
            const [beginEnd, setBeginEnd] = useState(1);
            const [enableWithdrawals, setEnableWithdrawals] = useState(null);
            const [year, setYear] = useState(null); // End year of build-up period

            // Reverse calculation mode (terugrekening)
            const [calculationMode, setCalculationMode] = useState(null); // 'buildup' or 'reverse'
            const [reverseTargetIncome, setReverseTargetIncome] = useState('');
            const [reverseYearsUntilRetirement, setReverseYearsUntilRetirement] = useState('');
            const [reverseWithdrawalDuration, setReverseWithdrawalDuration] = useState(20);
            const [reverseDeductAOWPension, setReverseDeductAOWPension] = useState(false);
            const [reverseInvestmentProfile, setReverseInvestmentProfile] = useState('Defensief');
            const [reverseCurrentCapital, setReverseCurrentCapital] = useState('');
            const [reverseBuildUpProfile, setReverseBuildUpProfile] = useState('Defensief');
            const [lumpSumPercentage, setLumpSumPercentage] = useState(0); // 0 = 100% periodic, 100 = 100% lump sum
            const [reverseApplyInflation, setReverseApplyInflation] = useState(true); // Apply inflation to target income

            // Withdrawal period inputs
            const [withdrawalAmount, setWithdrawalAmount] = useState('');
            const [withdrawalDuration, setWithdrawalDuration] = useState(20); // Duration in years
            const [withdrawalProfile, setWithdrawalProfile] = useState('Defensief');
            const [savingsPeriod, setSavingsPeriod] = useState('');
            const [savingsInterest] = useState(0.015); // Fixed 1.5% for savings
            const [discountProfile, setDiscountProfile] = useState('Defensief');
            const [inflationCorrection, setInflationCorrection] = useState('');

            // AOW settings (SVB 2025, per 1 juli)
            const [deductAOW, setDeductAOW] = useState(false);
            const [aowAmount, setAowAmount] = useState(19349);
            const [hasPartner, setHasPartner] = useState(false);
            const [partnerBirthDate, setPartnerBirthDate] = useState('');
            const [partnerAowAge, setPartnerAowAge] = useState(null);
            const [partnerAowDate, setPartnerAowDate] = useState(null);
            const [partnerAowAmount, setPartnerAowAmount] = useState(13248);
            const [withdrawalIsCombined, setWithdrawalIsCombined] = useState(false);

            // Pension data from uploaded file
            const [pensionData, setPensionData] = useState(null);
            const [aowDataFromPDF, setAowDataFromPDF] = useState(null);
            const [uploadedFileName, setUploadedFileName] = useState('');
            const [usePDFData, setUsePDFData] = useState(false);
            const [partnerPensionData, setPartnerPensionData] = useState(null);
            const [partnerAowDataFromPDF, setPartnerAowDataFromPDF] = useState(null);
            const [partnerUploadedFileName, setPartnerUploadedFileName] = useState('');

            // New choice states
            const [wantToUploadPDF, setWantToUploadPDF] = useState(null); // null, true, or false
            const [wantToUploadPartnerPDF, setWantToUploadPartnerPDF] = useState(null); // null, true, or false
            const [showPensionInstructions, setShowPensionInstructions] = useState(false);

            // Modal state
            const [showModal, setShowModal] = useState(false);
            const [modalContent, setModalContent] = useState(null);

            // Calculated values
            const [results, setResults] = useState(null);

            // Format number to EU style (1.000.000,50)
            const formatNumber = (value) => {
                if (!value && value !== 0) return '';
                return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            };

            // Parse EU formatted string back to number
            const parseNumber = (value) => {
                if (!value) return 0;
                return Number(value.replace(/\./g, '').replace(',', '.'));
            };

            // Handle number input change
            const handleNumberChange = (value, setter) => {
                const cleaned = value.replace(/[^\d,]/g, '');
                const number = parseNumber(cleaned);
                if (!isNaN(number)) {
                    setter(number);
                }
            };

            // Calculate AOW age based on birth date
            const calculateAOWAge = (birthDateString) => {
                if (!birthDateString) return null;

                const birth = new Date(birthDateString);
                const birthYear = birth.getFullYear();
                const birthMonth = birth.getMonth() + 1;

                // AOW age rules based on birth date
                if (birthYear < 1947) return 65;
                if (birthYear === 1947 && birthMonth <= 6) return 65;
                if (birthYear === 1947 && birthMonth <= 11) return { years: 65, months: 1 };
                if (birthYear === 1947 || (birthYear === 1948 && birthMonth <= 2)) return { years: 65, months: 2 };
                if (birthYear === 1948 && birthMonth <= 5) return { years: 65, months: 3 };
                if (birthYear === 1948 && birthMonth <= 8) return { years: 65, months: 6 };
                if (birthYear === 1948 && birthMonth <= 11) return { years: 65, months: 7 };
                if (birthYear === 1948 || (birthYear === 1949 && birthMonth <= 2)) return { years: 65, months: 8 };
                if (birthYear === 1949 && birthMonth <= 5) return { years: 65, months: 9 };
                if (birthYear === 1949 && birthMonth <= 8) return { years: 65, months: 10 };
                if (birthYear === 1949 && birthMonth <= 11) return { years: 65, months: 11 };
                if (birthYear === 1949 || (birthYear === 1950 && birthMonth <= 2)) return 66;
                if (birthYear === 1950 && birthMonth <= 5) return { years: 66, months: 1 };
                if (birthYear === 1950 && birthMonth <= 8) return { years: 66, months: 2 };
                if (birthYear === 1950 && birthMonth <= 11) return { years: 66, months: 3 };
                if (birthYear === 1950 || (birthYear === 1951 && birthMonth <= 2)) return { years: 66, months: 4 };
                if (birthYear === 1951 && birthMonth <= 8) return { years: 66, months: 6 };
                if (birthYear === 1951 && birthMonth <= 11) return { years: 66, months: 7 };
                if (birthYear === 1951 || (birthYear === 1952 && birthMonth <= 2)) return { years: 66, months: 8 };
                if (birthYear === 1952 && birthMonth <= 11) return { years: 66, months: 9 };
                if (birthYear === 1952 || (birthYear === 1953 && birthMonth <= 2)) return { years: 66, months: 10 };
                if (birthYear === 1953 && birthMonth <= 8) return { years: 66, months: 11 };
                if (birthYear <= 1954) return 67;
                if (birthYear <= 1960) return 67;
                if (birthYear <= 1963 && (birthYear < 1963 || birthMonth <= 9)) return { years: 67, months: 3 };
                if (birthYear <= 1972 && (birthYear < 1972 || birthMonth <= 3)) return { years: 67, months: 9 };
                if (birthYear <= 1974) return 68;
                if (birthYear < 1978 || (birthYear === 1978 && birthMonth <= 9)) return { years: 68, months: 3 };
                if (birthYear < 1981 || (birthYear === 1981 && birthMonth <= 6)) return { years: 68, months: 6 };
                if (birthYear < 1985 || (birthYear === 1985 && birthMonth <= 3)) return { years: 68, months: 9 };
                if (birthYear <= 1987) return 69;
                if (birthYear <= 2000) return 70;
                return 70; // For people born after 2000, assume 70+ (not yet determined)
            };

            // Calculate age at a specific year
            const calculateAgeAtYear = (birthDateString, targetYear) => {
                if (!birthDateString || !targetYear) return null;
                const birth = new Date(birthDateString);
                const age = targetYear - birth.getFullYear();
                return age;
            };

            // Format AOW age for display
            const formatAOWAge = (aowAge) => {
                if (!aowAge) return '';
                if (typeof aowAge === 'number') return `${aowAge} jaar`;
                return `${aowAge.years} jaar${aowAge.months ? ` en ${aowAge.months} maand` : ''}`;
            };

            // Calculate the actual date when someone reaches AOW age
            const calculateAOWDate = (birthDateString, aowAge) => {
                if (!birthDateString || !aowAge) return null;

                const birth = new Date(birthDateString);
                const aowYears = typeof aowAge === 'number' ? aowAge : aowAge.years;
                const aowMonths = typeof aowAge === 'number' ? 0 : (aowAge.months || 0);

                const aowDateObj = new Date(birth);
                aowDateObj.setFullYear(birth.getFullYear() + aowYears);
                aowDateObj.setMonth(birth.getMonth() + aowMonths);

                return aowDateObj;
            };

            // Format AOW date for display
            const formatAOWDate = (aowDateObj) => {
                if (!aowDateObj) return '';
                const day = aowDateObj.getDate().toString().padStart(2, '0');
                const month = (aowDateObj.getMonth() + 1).toString().padStart(2, '0');
                const year = aowDateObj.getFullYear();
                return `${day}-${month}-${year}`;
            };

            // Auto-adjust AOW amounts based on actual partner status (SVB juli 2025)
            // Note: withdrawalIsCombined only affects withdrawal, not AOW rates
            useEffect(() => {
                if (deductAOW) {
                    if (hasPartner) {
                        // With partner: both get married rate €1.103,97 × 12 = €13.248
                        setAowAmount(13248);
                        setPartnerAowAmount(13248);
                    } else {
                        // No partner: single rate €1.612,44 × 12 = €19.349
                        setAowAmount(19349);
                        setPartnerAowAmount(0);
                    }
                }
            }, [hasPartner, deductAOW]);

            useEffect(() => {
                if (currentStep === 3) {
                    calculateResults();
                }
                // Calculate AOW age when birth date changes
                if (birthDate) {
                    const calculatedAOWAge = calculateAOWAge(birthDate);
                    setAowAge(calculatedAOWAge);
                    const calculatedAOWDate = calculateAOWDate(birthDate, calculatedAOWAge);
                    setAowDate(calculatedAOWDate);
                }
                // Calculate partner AOW age when partner birth date changes
                if (partnerBirthDate && hasPartner) {
                    const calculatedPartnerAOWAge = calculateAOWAge(partnerBirthDate);
                    setPartnerAowAge(calculatedPartnerAOWAge);
                    const calculatedPartnerAOWDate = calculateAOWDate(partnerBirthDate, calculatedPartnerAOWAge);
                    setPartnerAowDate(calculatedPartnerAOWDate);
                }
                // Calculate end year of build-up period
                if (period) {
                    const currentYear = new Date().getFullYear();
                    const endYear = currentYear + parseInt(period);
                    setYear(endYear);
                }
                // Calculate age at withdrawal (at current year after build-up)
                if (birthDate && year) {
                    const age = calculateAgeAtYear(birthDate, year);
                    setAgeAtWithdrawal(age);
                }
            }, [currentStep, name, birthDate, buildUpProfile, period, periodicDeposit, lumpSum, beginEnd, enableWithdrawals,
                withdrawalAmount, withdrawalDuration, withdrawalProfile, savingsPeriod, discountProfile, inflationCorrection,
                deductAOW, aowAmount, hasPartner, partnerBirthDate, partnerAowAmount, withdrawalIsCombined, year]);

            const handleStep0Next = () => {
                if (name && birthDate && calculationMode) {
                    if (calculationMode === 'buildup') {
                        setCurrentStep(1); // Go to build-up period
                    } else if (calculationMode === 'reverse') {
                        setCurrentStep(0.5); // Go to reverse calculation form
                    }
                }
            };

            const handleStep1Next = () => {
                setCurrentStep(1.5); // Question step
            };

            const handleWithdrawalDecision = (decision) => {
                setEnableWithdrawals(decision);
                if (decision) {
                    setCurrentStep(2); // Go to withdrawal form
                } else {
                    calculateResults();
                    setCurrentStep(3); // Go to dashboard
                }
            };

            const handleStep2Next = () => {
                calculateResults();
                setCurrentStep(3); // Go to dashboard
            };

            const handleBack = () => {
                if (currentStep === 0.5) {
                    setCurrentStep(0);
                } else if (currentStep === 1) {
                    setCurrentStep(0);
                } else if (currentStep === 2) {
                    setCurrentStep(1.5);
                } else if (currentStep === 1.5) {
                    setCurrentStep(1);
                } else if (currentStep === 3) {
                    if (calculationMode === 'reverse') {
                        setCurrentStep(0.5);
                    } else if (enableWithdrawals) {
                        setCurrentStep(2);
                    } else {
                        setCurrentStep(1.5);
                    }
                }
            };

            const handleRestart = () => {
                setCurrentStep(0);
                setEnableWithdrawals(null);
                setCalculationMode(null);
                setReverseTargetIncome('');
                setReverseYearsUntilRetirement('');
                setReverseWithdrawalDuration(20);
                setReverseDeductAOWPension(false);
                setReverseApplyInflation(true);
                setReverseCurrentCapital('');
                setReverseBuildUpProfile('Defensief');
                setReverseInvestmentProfile('Defensief');
                setLumpSumPercentage(0);
                setResults(null);
            };

            const handleFileUpload = async (event) => {
                const file = event.target.files[0];
                if (!file) return;

                setUploadedFileName(file.name);
                const fileType = file.name.split('.').pop().toLowerCase();

                try {
                    if (fileType === 'json') {
                        const text = await file.text();
                        const data = JSON.parse(text);
                        parsePensionData(data);
                    } else if (fileType === 'xml') {
                        const text = await file.text();
                        const parser = new DOMParser();
                        const xmlDoc = parser.parseFromString(text, 'text/xml');
                        parsePensionXML(xmlDoc);
                    } else if (fileType === 'pdf') {
                        await parsePensionPDF(file);
                    }
                } catch (error) {
                    alert('Fout bij het inlezen van het bestand: ' + error.message);
                }
            };

            const handlePartnerFileUpload = async (event) => {
                const file = event.target.files[0];
                if (!file) return;

                setPartnerUploadedFileName(file.name);
                const fileType = file.name.split('.').pop().toLowerCase();

                try {
                    if (fileType === 'json') {
                        const text = await file.text();
                        const data = JSON.parse(text);
                        parsePartnerPensionData(data);
                    } else if (fileType === 'xml') {
                        const text = await file.text();
                        const parser = new DOMParser();
                        const xmlDoc = parser.parseFromString(text, 'text/xml');
                        parsePartnerPensionXML(xmlDoc);
                    } else if (fileType === 'pdf') {
                        await parsePartnerPensionPDF(file);
                    }
                } catch (error) {
                    alert('Fout bij het inlezen van het partner bestand: ' + error.message);
                }
            };

            const parsePensionData = (data) => {
                // Parse JSON structure from Mijnpensioenoverzicht.nl
                // Expected structure: array of pension records with year and amount
                // Example: [{ year: 2046, amount: 15000 }, { year: 2047, amount: 15500 }]

                if (Array.isArray(data)) {
                    setPensionData(data);
                } else if (data.pensions && Array.isArray(data.pensions)) {
                    setPensionData(data.pensions);
                } else {
                    alert('Onbekende JSON structuur. Verwacht een array met { year, amount } objecten.');
                }
            };

            const parsePensionXML = (xmlDoc) => {
                // Parse XML structure from Mijnpensioenoverzicht.nl
                const pensionElements = xmlDoc.getElementsByTagName('pension');
                const pensions = [];

                for (let i = 0; i < pensionElements.length; i++) {
                    const pension = pensionElements[i];
                    const year = parseInt(pension.getElementsByTagName('year')[0]?.textContent);
                    const amount = parseFloat(pension.getElementsByTagName('amount')[0]?.textContent);

                    if (year && amount) {
                        pensions.push({ year, amount });
                    }
                }

                if (pensions.length > 0) {
                    setPensionData(pensions);
                } else {
                    alert('Geen pensioengegevens gevonden in XML bestand.');
                }
            };

            const parsePensionPDF = async (file) => {
                try {
                    // Configure PDF.js worker
                    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

                    // Read file as ArrayBuffer
                    const arrayBuffer = await file.arrayBuffer();

                    // Load PDF document
                    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

                    // Extract text from all pages
                    let fullText = '';
                    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                        const page = await pdf.getPage(pageNum);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items.map(item => item.str).join(' ');
                        fullText += pageText + '\n';
                    }

                    // Try to extract birth date for year calculation
                    let birthYear = null;
                    const birthDateMatch = fullText.match(/Geboortedatum:\s*(\d{2})-(\d{2})-(\d{4})/);
                    if (birthDateMatch) {
                        birthYear = parseInt(birthDateMatch[3]);
                    }

                    let aowData = null;
                    let pensionData = null;

                    // Strategy 1: Parse Mijnpensioenoverzicht.nl specific structure
                    // Look for "Uw AOW" rows with "Te bereiken" and "Opgebouwd" amounts
                    const aowPattern = /Uw AOW\s+Te bereiken\s+Opgebouwd\s+Voor ex-partner\s+Herkenningsnummer\s+Stand per\s+([^\s]+)\s+€\s*([\d.,]+)\s+€\s*([\d.,]+)\s+(\S*)\s+(\S*)\s+([\d-]+)/gi;
                    let aowMatch = aowPattern.exec(fullText);

                    if (!aowMatch) {
                        // Fallback: simpler pattern
                        const aowSections = fullText.match(/Uw AOW\s+Te bereiken\s+Opgebouwd[\s\S]*?€\s*([\d.,]+)\s+€\s*([\d.,]+)/gi);
                        if (aowSections && aowSections.length > 0) {
                            const section = aowSections[0];
                            const amounts = section.match(/€\s*([\d.,]+)/g);
                            if (amounts && amounts.length >= 2) {
                                const teBereiken = parseFloat(amounts[0].replace('€', '').trim().replace(/\./g, '').replace(',', '.'));
                                const opgebouwd = parseFloat(amounts[1].replace('€', '').trim().replace(/\./g, '').replace(',', '.'));

                                // Try to find SVB and date info
                                const svbMatch = fullText.match(/Sociale Verzekeringsbank/);
                                const dateMatch = fullText.match(/Stand per[^\d]*(\d{2}-\d{2}-\d{4})/);

                                if (teBereiken > 0) {
                                    aowData = {
                                        amount: teBereiken,
                                        teBereiken: teBereiken,
                                        opgebouwd: opgebouwd,
                                        organisatie: svbMatch ? 'Sociale Verzekeringsbank' : 'AOW',
                                        standPer: dateMatch ? dateMatch[1] : null
                                    };
                                }
                            }
                        }
                    } else {
                        const organisatie = aowMatch[1];
                        const teBereiken = parseFloat(aowMatch[2].replace(/\./g, '').replace(',', '.'));
                        const opgebouwd = parseFloat(aowMatch[3].replace(/\./g, '').replace(',', '.'));
                        const standPer = aowMatch[6];

                        if (teBereiken > 0) {
                            aowData = {
                                amount: teBereiken,
                                teBereiken: teBereiken,
                                opgebouwd: opgebouwd,
                                organisatie: organisatie || 'Sociale Verzekeringsbank',
                                standPer: standPer
                            };
                        }
                    }

                    // Look for "Indicatief pensioen" rows with detailed info
                    const pensionPattern = /Indicatief pensioen\s+Te bereiken\s+Opgebouwd\s+Voor ex-partner\s+Herkenningsnummer\s+Stand per\s+([^\s€]+)\s+€\s*([\d.,]+)\s+€\s*([\d.,]+)\s+(\S+)\s+(\S+)\s+([\d-]+)/gi;
                    let pensionMatch = pensionPattern.exec(fullText);

                    if (!pensionMatch) {
                        // Fallback: simpler pattern
                        const pensionSections = fullText.match(/Indicatief pensioen\s+Te bereiken\s+Opgebouwd[\s\S]*?€\s*([\d.,]+)\s+€\s*([\d.,]+)/gi);
                        if (pensionSections && pensionSections.length > 0) {
                            const section = pensionSections[0];
                            const amounts = section.match(/€\s*([\d.,]+)/g);
                            if (amounts && amounts.length >= 2) {
                                const teBereiken = parseFloat(amounts[0].replace('€', '').trim().replace(/\./g, '').replace(',', '.'));
                                const opgebouwd = parseFloat(amounts[1].replace('€', '').trim().replace(/\./g, '').replace(',', '.'));

                                // Try to find age context before this section
                                const beforeText = fullText.substring(0, fullText.indexOf(section));
                                const ageMatch = beforeText.match(/Van\s+(\d+)\s+jaar|Vanaf\s+(\d+)\s+jaar/gi);

                                // Try to find pension provider
                                const providerMatch = beforeText.match(/([a-z.]+)\s*€\s*[\d.,]+\s+€\s*[\d.,]+\s+\w+\s+\w+\s+[\d-]+$/im);
                                const afterMatch = fullText.substring(fullText.indexOf(section)).match(/([a-zA-Z.]+)\s+€/);

                                let ageNum = 68; // default
                                if (ageMatch && birthYear) {
                                    const lastAgeMatch = ageMatch[ageMatch.length - 1];
                                    ageNum = parseInt(lastAgeMatch.match(/\d+/)[0]);
                                }

                                if (teBereiken > 0) {
                                    pensionData = {
                                        startAge: ageNum,
                                        amount: teBereiken,
                                        teBereiken: teBereiken,
                                        opgebouwd: opgebouwd,
                                        uitvoerder: afterMatch ? afterMatch[1] : 'Pensioenuitvoerder',
                                        startYear: birthYear ? birthYear + ageNum : null,
                                        standPer: null
                                    };
                                }
                            }
                        }
                    } else {
                        const uitvoerder = pensionMatch[1];
                        const teBereiken = parseFloat(pensionMatch[2].replace(/\./g, '').replace(',', '.'));
                        const opgebouwd = parseFloat(pensionMatch[3].replace(/\./g, '').replace(',', '.'));
                        const herkenningsnummer = pensionMatch[5];
                        const standPer = pensionMatch[6];

                        // Try to find age context
                        const beforeText = fullText.substring(0, pensionMatch.index);
                        const ageMatch = beforeText.match(/Van\s+(\d+)\s+jaar|Vanaf\s+(\d+)\s+jaar/gi);

                        let ageNum = 68; // default
                        if (ageMatch && birthYear) {
                            const lastAgeMatch = ageMatch[ageMatch.length - 1];
                            ageNum = parseInt(lastAgeMatch.match(/\d+/)[0]);
                        }

                        if (teBereiken > 0) {
                            pensionData = {
                                startAge: ageNum,
                                amount: teBereiken,
                                teBereiken: teBereiken,
                                opgebouwd: opgebouwd,
                                uitvoerder: uitvoerder,
                                herkenningsnummer: herkenningsnummer,
                                startYear: birthYear ? birthYear + ageNum : null,
                                standPer: standPer
                            };
                        }
                    }

                    // Build message and set state
                    let message = '';
                    if (aowData) {
                        setAowDataFromPDF(aowData);
                        message += `AOW: ${formatCurrency(aowData.amount)}/jaar`;
                    }

                    if (pensionData) {
                        setPensionData(pensionData);
                        if (message) message += ' | ';
                        message += `Pensioen vanaf ${pensionData.startAge} jaar: ${formatCurrency(pensionData.amount)}/jaar`;
                    }

                    if (aowData || pensionData) {
                        alert(`Succesvol geëxtraheerd:\n${message}\n\nAOW wordt toegepast vanaf uw AOW-leeftijd (berekend in stap 1).\nPensioen wordt toegepast vanaf de aangegeven leeftijd.\nU kunt in stap 3 kiezen of u deze gegevens wilt gebruiken.`);
                    } else {
                        alert('Geen AOW of pensioengegevens gevonden in PDF. Zorg ervoor dat het PDF data bevat van Mijnpensioenoverzicht.nl.');
                    }

                } catch (error) {
                    console.error('PDF parsing error:', error);
                    alert('Fout bij het inlezen van PDF: ' + error.message);
                }
            };

            const parsePartnerPensionData = (data) => {
                if (Array.isArray(data)) {
                    setPartnerPensionData(data);
                } else if (data.pensions && Array.isArray(data.pensions)) {
                    setPartnerPensionData(data.pensions);
                } else {
                    alert('Onbekende JSON structuur voor partner. Verwacht een array met { year, amount } objecten.');
                }
            };

            const parsePartnerPensionXML = (xmlDoc) => {
                const pensionElements = xmlDoc.getElementsByTagName('pension');
                const pensions = [];

                for (let i = 0; i < pensionElements.length; i++) {
                    const pension = pensionElements[i];
                    const year = parseInt(pension.getElementsByTagName('year')[0]?.textContent);
                    const amount = parseFloat(pension.getElementsByTagName('amount')[0]?.textContent);

                    if (year && amount) {
                        pensions.push({ year, amount });
                    }
                }

                if (pensions.length > 0) {
                    setPartnerPensionData(pensions);
                } else {
                    alert('Geen pensioengegevens gevonden in partner XML bestand.');
                }
            };

            const parsePartnerPensionPDF = async (file) => {
                try {
                    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                    const arrayBuffer = await file.arrayBuffer();
                    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

                    let fullText = '';
                    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                        const page = await pdf.getPage(pageNum);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items.map(item => item.str).join(' ');
                        fullText += pageText + '\n';
                    }

                    // Try to extract birth date for year calculation
                    let birthYear = null;
                    const birthDateMatch = fullText.match(/Geboortedatum:\s*(\d{2})-(\d{2})-(\d{4})/);
                    if (birthDateMatch) {
                        birthYear = parseInt(birthDateMatch[3]);
                    }

                    let aowData = null;
                    let pensionData = null;

                    // Parse AOW data (same as main person)
                    const aowPattern = /Uw AOW\s+Te bereiken\s+Opgebouwd\s+Voor ex-partner\s+Herkenningsnummer\s+Stand per\s+([^\s]+)\s+€\s*([\d.,]+)\s+€\s*([\d.,]+)\s+(\S*)\s+(\S*)\s+([\d-]+)/gi;
                    let aowMatch = aowPattern.exec(fullText);

                    if (!aowMatch) {
                        // Fallback: simpler pattern
                        const aowSections = fullText.match(/Uw AOW\s+Te bereiken\s+Opgebouwd[\s\S]*?€\s*([\d.,]+)\s+€\s*([\d.,]+)/gi);
                        if (aowSections && aowSections.length > 0) {
                            const section = aowSections[0];
                            const amounts = section.match(/€\s*([\d.,]+)/g);
                            if (amounts && amounts.length >= 2) {
                                const teBereiken = parseFloat(amounts[0].replace('€', '').trim().replace(/\./g, '').replace(',', '.'));
                                const opgebouwd = parseFloat(amounts[1].replace('€', '').trim().replace(/\./g, '').replace(',', '.'));

                                const svbMatch = fullText.match(/Sociale Verzekeringsbank/);
                                const dateMatch = fullText.match(/Stand per[^\d]*(\d{2}-\d{2}-\d{4})/);

                                if (teBereiken > 0) {
                                    aowData = {
                                        amount: teBereiken,
                                        teBereiken: teBereiken,
                                        opgebouwd: opgebouwd,
                                        organisatie: svbMatch ? 'Sociale Verzekeringsbank' : 'AOW',
                                        standPer: dateMatch ? dateMatch[1] : null
                                    };
                                }
                            }
                        }
                    } else {
                        const organisatie = aowMatch[1];
                        const teBereiken = parseFloat(aowMatch[2].replace(/\./g, '').replace(',', '.'));
                        const opgebouwd = parseFloat(aowMatch[3].replace(/\./g, '').replace(',', '.'));
                        const standPer = aowMatch[6];

                        if (teBereiken > 0) {
                            aowData = {
                                amount: teBereiken,
                                teBereiken: teBereiken,
                                opgebouwd: opgebouwd,
                                organisatie: organisatie || 'Sociale Verzekeringsbank',
                                standPer: standPer
                            };
                        }
                    }

                    // Store AOW data
                    if (aowData) {
                        setPartnerAowDataFromPDF(aowData);
                    }

                    // Parse pension data
                    const pensionPattern = /Indicatief pensioen\s+Te bereiken\s+Opgebouwd\s+Voor ex-partner\s+Herkenningsnummer\s+Stand per\s+([^\s€]+)\s+€\s*([\d.,]+)\s+€\s*([\d.,]+)\s+(\S+)\s+(\S+)\s+([\d-]+)/gi;
                    let pensionMatch = pensionPattern.exec(fullText);

                    if (!pensionMatch) {
                        const pensionSections = fullText.match(/Indicatief pensioen\s+Te bereiken\s+Opgebouwd[\s\S]*?€\s*([\d.,]+)\s+€\s*([\d.,]+)/gi);
                        if (pensionSections && pensionSections.length > 0) {
                            const section = pensionSections[0];
                            const amounts = section.match(/€\s*([\d.,]+)/g);
                            if (amounts && amounts.length >= 2) {
                                const teBereiken = parseFloat(amounts[0].replace('€', '').trim().replace(/\./g, '').replace(',', '.'));
                                const opgebouwd = parseFloat(amounts[1].replace('€', '').trim().replace(/\./g, '').replace(',', '.'));

                                const dateMatch = fullText.match(/Stand per[^\d]*(\d{2}-\d{2}-\d{4})/);
                                const organisatieMatch = fullText.match(/Indicatief pensioen\s+Te bereiken\s+Opgebouwd[^€]*€[^€]*€[^\n]*\n([^\s]+)/);

                                if (teBereiken > 0) {
                                    pensionData = {
                                        amount: teBereiken,
                                        teBereiken: teBereiken,
                                        opgebouwd: opgebouwd,
                                        organisatie: organisatieMatch ? organisatieMatch[1] : 'Pensioen',
                                        standPer: dateMatch ? dateMatch[1] : null
                                    };
                                }
                            }
                        }
                    } else {
                        const organisatie = pensionMatch[1];
                        const teBereiken = parseFloat(pensionMatch[2].replace(/\./g, '').replace(',', '.'));
                        const opgebouwd = parseFloat(pensionMatch[3].replace(/\./g, '').replace(',', '.'));
                        const standPer = pensionMatch[6];

                        if (teBereiken > 0) {
                            pensionData = {
                                amount: teBereiken,
                                teBereiken: teBereiken,
                                opgebouwd: opgebouwd,
                                organisatie: organisatie,
                                standPer: standPer
                            };
                        }
                    }

                    if (pensionData) {
                        if (birthYear) {
                            const retirementAge = 68;
                            const startYear = birthYear + retirementAge;
                            const endYear = startYear + 30;

                            const pensionArray = [];
                            for (let year = startYear; year <= endYear; year++) {
                                pensionArray.push({
                                    year: year,
                                    amount: pensionData.amount
                                });
                            }
                            setPartnerPensionData(pensionArray);
                        } else {
                            alert('Partner: Kon geboortedatum niet vinden in PDF. Voeg handmatig pensioengegevens toe.');
                        }
                    }

                    if (!aowData && !pensionData) {
                        alert('Partner: Kon geen AOW of pensioengegevens vinden in PDF.');
                    }
                } catch (error) {
                    alert('Fout bij het inlezen van partner PDF: ' + error.message);
                }
            };

            const calculateReverseResults = () => {
                console.log('=== START BEREKENING ===');
                console.log('Huidig vermogen input:', reverseCurrentCapital, 'type:', typeof reverseCurrentCapital);
                console.log('Inflatiecorrectie toepassen:', reverseApplyInflation);

                const investmentReturn = InvestmentProfiles[reverseInvestmentProfile];
                const inflationRate = 0.02; // 2% inflation

                // Calculate start year and retirement age
                const currentYear = new Date().getFullYear();
                const yearsToRetirement = parseInt(reverseYearsUntilRetirement);
                const retirementYear = currentYear + yearsToRetirement;
                const endYear = retirementYear + reverseWithdrawalDuration;

                console.log('Gewenst jaarinkomen bij start uitkering:', reverseTargetIncome);
                console.log('Inflatiecorrectie tijdens uitkering:', reverseApplyInflation ? 'Ja' : 'Nee');
                console.log('AOW aftrekken:', reverseDeductAOWPension ? 'Ja' : 'Nee');
                console.log('');
                console.log('Year-by-year breakdown (eerste 5 jaar):');

                let birthYear = null;
                if (birthDate) {
                    const birthDateObj = new Date(birthDate);
                    birthYear = birthDateObj.getFullYear();
                }

                // Helper function to calculate what fraction of a year someone receives AOW
                const getAOWFraction = (birthDateString, aowAgeObj, targetYear) => {
                    if (!birthDateString || !aowAgeObj) return 0;
                    const birth = new Date(birthDateString);
                    const aowYears = typeof aowAgeObj === 'number' ? aowAgeObj : aowAgeObj.years;
                    const aowMonths = typeof aowAgeObj === 'number' ? 0 : (aowAgeObj.months || 0);
                    const aowReachedDate = new Date(birth);
                    aowReachedDate.setFullYear(birth.getFullYear() + aowYears);
                    aowReachedDate.setMonth(birth.getMonth() + aowMonths);
                    const aowReachedYear = aowReachedDate.getFullYear();

                    if (targetYear < aowReachedYear) {
                        return 0;
                    } else if (targetYear > aowReachedYear) {
                        return 1.0;
                    } else {
                        const aowMonth = aowReachedDate.getMonth();
                        const monthsInYear = 12 - aowMonth;
                        return monthsInYear / 12;
                    }
                };

                // Calculate year-by-year withdrawals needed and present value
                const yearByYear = [];
                let totalRequiredWithdrawal = 0;
                let totalAowDeduction = 0;
                let totalPensionIncome = 0;
                let requiredCapital = 0;

                for (let i = 1; i <= reverseWithdrawalDuration; i++) {
                    const year = retirementYear + i - 1;

                    // Target income with inflation during withdrawal period (if enabled)
                    let inflatedTargetIncome;
                    if (reverseApplyInflation) {
                        // Apply inflation each year during withdrawal period
                        // Year 1 = base × 1.02^1, Year 2 = base × 1.02^2, etc.
                        inflatedTargetIncome = reverseTargetIncome * Math.pow(1 + inflationRate, i);
                    } else {
                        // Keep income constant
                        inflatedTargetIncome = reverseTargetIncome;
                    }

                    // Calculate AOW deduction if enabled
                    let aowDeduction = 0;
                    if (reverseDeductAOWPension) {
                        // User AOW
                        const userAowFraction = getAOWFraction(birthDate, aowAge, year);
                        if (userAowFraction > 0) {
                            // Apply inflation to AOW if inflation correction is enabled
                            const inflatedAowAmount = reverseApplyInflation
                                ? aowAmount * Math.pow(1 + inflationRate, i)
                                : aowAmount;
                            aowDeduction += inflatedAowAmount * userAowFraction;
                        }

                        // Partner AOW if applicable
                        if (hasPartner && partnerBirthDate && partnerAowAge) {
                            const partnerAowFraction = getAOWFraction(partnerBirthDate, partnerAowAge, year);
                            if (partnerAowFraction > 0) {
                                // Apply inflation to partner AOW if inflation correction is enabled
                                const inflatedPartnerAowAmount = reverseApplyInflation
                                    ? partnerAowAmount * Math.pow(1 + inflationRate, i)
                                    : partnerAowAmount;
                                aowDeduction += inflatedPartnerAowAmount * partnerAowFraction;
                            }
                        }
                    }

                    // TODO: Add pension deduction if PDF data is available
                    let pensionIncome = 0;

                    // Net withdrawal needed from investment
                    const netWithdrawal = Math.max(0, inflatedTargetIncome - aowDeduction - pensionIncome);

                    totalRequiredWithdrawal += netWithdrawal;
                    totalAowDeduction += aowDeduction;
                    totalPensionIncome += pensionIncome;

                    // Present value of this withdrawal (discounted back to retirement year)
                    const presentValue = netWithdrawal / Math.pow(1 + investmentReturn, i);
                    requiredCapital += presentValue;

                    // Log all years for debugging
                    console.log(`  Jaar ${i} (${year}): Bruto €${inflatedTargetIncome.toFixed(2)} - AOW €${aowDeduction.toFixed(2)} = Netto €${netWithdrawal.toFixed(2)} | Discount factor: ${Math.pow(1 + investmentReturn, i).toFixed(4)} | PV: €${presentValue.toFixed(2)} | Running total: €${requiredCapital.toFixed(2)}`);

                    yearByYear.push({
                        year: year,
                        targetIncome: inflatedTargetIncome,
                        aowDeduction: aowDeduction,
                        pensionIncome: pensionIncome,
                        netWithdrawal: netWithdrawal,
                        presentValue: presentValue
                    });
                }

                console.log('=== RESULTATEN ===');
                console.log('Rendement tijdens onttrekperiode:', (investmentReturn * 100).toFixed(1) + '%');
                console.log('Totale onttrekking (nominaal, geen PV):', totalRequiredWithdrawal.toFixed(2));
                console.log('');
                console.log('STAP 1: Benodigd vermogen bij PENSIONERING (sum van alle PV)');
                console.log('  = Som van alle onttrekkingen contant gemaakt naar pensioenjaar');
                console.log('  = €' + requiredCapital.toFixed(2));
                console.log('');

                // Calculate required periodic deposits
                const buildUpReturn = InvestmentProfiles[reverseBuildUpProfile];

                // Ensure reverseCurrentCapital is a number
                const currentCapitalNumber = parseFloat(reverseCurrentCapital) || 0;
                console.log('Huidig vermogen als number:', currentCapitalNumber);

                // Future value of current capital
                const futureValueOfCurrentCapital = currentCapitalNumber * Math.pow(1 + buildUpReturn, yearsToRetirement);
                console.log('Toekomstige waarde huidig vermogen:', futureValueOfCurrentCapital);

                // Shortage (what we still need to save)
                const shortage = Math.max(0, requiredCapital - futureValueOfCurrentCapital);
                console.log('Tekort (shortage):', shortage);
                console.log('=== EINDE BEREKENING ===');

                // Calculate lump sum and periodic portions based on slider
                const lumpSumPortion = shortage * (lumpSumPercentage / 100);
                const periodicPortion = shortage * (1 - lumpSumPercentage / 100);

                // Required lump sum (present value)
                let requiredLumpSum = 0;
                if (lumpSumPortion > 0 && yearsToRetirement > 0) {
                    // PV = FV / (1 + r)^n
                    requiredLumpSum = lumpSumPortion / Math.pow(1 + buildUpReturn, yearsToRetirement);
                }

                // Required annual deposit (end of year) for periodic portion
                let requiredAnnualDeposit = 0;
                if (periodicPortion > 0 && yearsToRetirement > 0) {
                    // PMT = FV / [((1 + r)^n - 1) / r]
                    requiredAnnualDeposit = periodicPortion / ((Math.pow(1 + buildUpReturn, yearsToRetirement) - 1) / buildUpReturn);
                }

                // Required monthly deposit for periodic portion
                // Convert annual return to monthly: (1 + annual)^(1/12) - 1
                const monthlyReturn = Math.pow(1 + buildUpReturn, 1/12) - 1;
                const monthsToRetirement = yearsToRetirement * 12;

                let requiredMonthlyDeposit = 0;
                if (periodicPortion > 0 && monthsToRetirement > 0) {
                    requiredMonthlyDeposit = periodicPortion / ((Math.pow(1 + monthlyReturn, monthsToRetirement) - 1) / monthlyReturn);
                }

                // Also calculate full amounts for reference (100% lump sum or 100% periodic)
                const fullLumpSum = shortage > 0 && yearsToRetirement > 0 ? shortage / Math.pow(1 + buildUpReturn, yearsToRetirement) : 0;
                const fullAnnualDeposit = shortage > 0 && yearsToRetirement > 0 ? shortage / ((Math.pow(1 + buildUpReturn, yearsToRetirement) - 1) / buildUpReturn) : 0;
                const fullMonthlyDeposit = shortage > 0 && monthsToRetirement > 0 ? shortage / ((Math.pow(1 + monthlyReturn, monthsToRetirement) - 1) / monthlyReturn) : 0;

                console.log('STAP 2: Eenmalige inleg NU berekenen');
                console.log('  Benodigd bij pensionering: €' + requiredCapital.toFixed(2));
                console.log('  Huidig vermogen groeit naar: €' + futureValueOfCurrentCapital.toFixed(2));
                console.log('  Tekort (shortage): €' + shortage.toFixed(2));
                console.log('  Rendement tijdens opbouw: ' + (buildUpReturn * 100).toFixed(1) + '%');
                console.log('  Jaren tot pensionering: ' + yearsToRetirement);
                console.log('  Formule: shortage / (1 + r)^n');
                console.log('  = ' + shortage.toFixed(2) + ' / (1.0' + (buildUpReturn * 100).toFixed(0) + ')^' + yearsToRetirement);
                console.log('  = €' + fullLumpSum.toFixed(2));
                console.log('=== EINDE BEREKENING ===');

                // Set results
                setResults({
                    mode: 'reverse',
                    requiredCapitalAtRetirement: requiredCapital,
                    retirementYear: retirementYear,
                    retirementAge: calculateAgeAtYear(birthDate, retirementYear),
                    withdrawalDuration: reverseWithdrawalDuration,
                    targetIncome: reverseTargetIncome,
                    applyInflation: reverseApplyInflation,
                    totalRequiredWithdrawal: totalRequiredWithdrawal,
                    totalAowDeduction: totalAowDeduction,
                    totalPensionIncome: totalPensionIncome,
                    yearByYear: yearByYear,
                    investmentProfile: reverseInvestmentProfile,
                    investmentReturn: investmentReturn,
                    buildUpProfile: reverseBuildUpProfile,
                    buildUpReturn: buildUpReturn,
                    currentCapital: currentCapitalNumber,
                    futureValueOfCurrentCapital: futureValueOfCurrentCapital,
                    shortage: shortage,
                    lumpSumPercentage: lumpSumPercentage,
                    lumpSumPortion: lumpSumPortion,
                    periodicPortion: periodicPortion,
                    requiredLumpSum: requiredLumpSum,
                    requiredAnnualDeposit: requiredAnnualDeposit,
                    requiredMonthlyDeposit: requiredMonthlyDeposit,
                    fullLumpSum: fullLumpSum,
                    fullAnnualDeposit: fullAnnualDeposit,
                    fullMonthlyDeposit: fullMonthlyDeposit,
                    yearsToRetirement: yearsToRetirement
                });
            };

            const calculateResults = () => {
                // Handle reverse calculation mode (Vermogensbehoefteberekening)
                if (calculationMode === 'reverse') {
                    calculateReverseResults();
                    return;
                }

                const buildUpReturn = InvestmentProfiles[buildUpProfile];
                const withdrawalReturn = InvestmentProfiles[withdrawalProfile];
                const discountRate = InvestmentProfiles[discountProfile]; // Get discount rate from profile

                // Withdrawal starts immediately after build-up period
                const startYear = year;
                const endYear = year + withdrawalDuration;
                const withdrawalPeriod = withdrawalDuration;

                // Get birth year from birthDate for PDF data calculations
                let birthYear = null;
                if (birthDate) {
                    const birthDateObj = new Date(birthDate);
                    birthYear = birthDateObj.getFullYear();
                }

                // Calculate future value of initial investment
                // FV = PV * (1 + r)^n + PMT * [((1 + r)^n - 1) / r]
                let futureValue;
                if (periodicDeposit > 0) {
                    const fvLumpSum = lumpSum * Math.pow(1 + buildUpReturn, period);
                    const fvPeriodic = periodicDeposit * ((Math.pow(1 + buildUpReturn, period) - 1) / buildUpReturn);
                    futureValue = beginEnd === 1 ?
                        (fvLumpSum + fvPeriodic * (1 + buildUpReturn)) :
                        (fvLumpSum + fvPeriodic);
                } else {
                    futureValue = lumpSum * Math.pow(1 + buildUpReturn, period);
                }

                // Helper function to check if someone has reached AOW age in a given year
                const hasReachedAOW = (birthDateString, aowAgeObj, targetYear) => {
                    if (!birthDateString || !aowAgeObj) return false;
                    const birth = new Date(birthDateString);
                    const aowYears = typeof aowAgeObj === 'number' ? aowAgeObj : aowAgeObj.years;
                    const aowMonths = typeof aowAgeObj === 'number' ? 0 : (aowAgeObj.months || 0);
                    const aowReachedDate = new Date(birth);
                    aowReachedDate.setFullYear(birth.getFullYear() + aowYears);
                    aowReachedDate.setMonth(birth.getMonth() + aowMonths);
                    const aowReachedYear = aowReachedDate.getFullYear();
                    return targetYear >= aowReachedYear;
                };

                // Helper function to calculate what fraction of a year someone receives AOW
                // Returns 1.0 for full year, or fraction like 0.833 for 10/12 months
                const getAOWFraction = (birthDateString, aowAgeObj, targetYear) => {
                    if (!birthDateString || !aowAgeObj) return 0;
                    const birth = new Date(birthDateString);
                    const aowYears = typeof aowAgeObj === 'number' ? aowAgeObj : aowAgeObj.years;
                    const aowMonths = typeof aowAgeObj === 'number' ? 0 : (aowAgeObj.months || 0);
                    const aowReachedDate = new Date(birth);
                    aowReachedDate.setFullYear(birth.getFullYear() + aowYears);
                    aowReachedDate.setMonth(birth.getMonth() + aowMonths);
                    const aowReachedYear = aowReachedDate.getFullYear();

                    if (targetYear < aowReachedYear) {
                        // Haven't reached AOW age yet
                        return 0;
                    } else if (targetYear > aowReachedYear) {
                        // Full year of AOW
                        return 1.0;
                    } else {
                        // First year - partial AOW
                        // Calculate how many months from AOW start date to end of year
                        const aowMonth = aowReachedDate.getMonth(); // 0-11
                        const monthsInYear = 12 - aowMonth; // months from start month to end of year
                        return monthsInYear / 12;
                    }
                };

                // Calculate year-by-year withdrawals and present values
                const yearByYear = [];
                let totalWithdrawals = 0;
                let totalPresentValue = 0;
                let totalAowDeduction = 0;
                let totalPensionIncome = 0;

                for (let i = 1; i <= withdrawalPeriod; i++) {
                    const year = startYear + i - 1;

                    // Withdrawal with inflation correction
                    let inflatedWithdrawal = withdrawalAmount * Math.pow(1 + inflationCorrection, i - 1);

                    // Look up AOW income from PDF for this year (for USER only)
                    // Only use if user chose to upload PDF and actually uploaded it
                    let aowFromPDF = 0;
                    if (wantToUploadPDF === true && usePDFData && aowDataFromPDF) {
                        // Use the AOW date calculated in step 1 (which accounts for exact months)
                        if (aowDate) {
                            const aowStartYear = aowDate.getFullYear();
                            // Check if the current year is >= AOW start year
                            if (year >= aowStartYear) {
                                // Use bruto amount from PDF for USER
                                aowFromPDF = aowDataFromPDF.amount;
                            }
                        }
                    }

                    // Look up pension income from PDF for this year
                    // Only use if user chose to upload PDF and actually uploaded it
                    let pensionIncome = 0;
                    if (wantToUploadPDF === true && usePDFData && pensionData) {
                        // Calculate pension start year based on birth year + pension start age
                        if (birthYear && pensionData.startAge) {
                            const pensionStartYear = birthYear + pensionData.startAge;
                            // Check if the current year is >= pension start year
                            if (year >= pensionStartYear) {
                                // Use bruto amount from PDF
                                pensionIncome = pensionData.amount;
                            }
                        }
                    }

                    // Add partner pension income if available and combined withdrawal is enabled
                    // Only use partner PDF data if they chose to upload it
                    if (hasPartner && withdrawalIsCombined && wantToUploadPartnerPDF === true && partnerPensionData) {
                        const partnerPension = partnerPensionData.find(p => p.year === year);
                        if (partnerPension) {
                            pensionIncome += partnerPension.amount;
                        }
                    }

                    // Calculate AOW deduction for this year
                    let aowDeduction = 0;
                    let userAowActive = false;
                    let partnerAowActive = false;
                    let userAowFraction = 0;
                    let partnerAowFraction = 0;
                    let partnerAowFromManual = 0;
                    let partnerAowFromPDF = 0;

                    // User AOW: from PDF if available, otherwise manual
                    if (aowFromPDF > 0) {
                        // User AOW from PDF - also apply pro-rata for partial year
                        userAowFraction = getAOWFraction(birthDate, aowAge, year);
                        if (userAowFraction > 0) {
                            userAowActive = true;
                            aowDeduction = aowFromPDF * userAowFraction;
                        }
                    } else if (deductAOW) {
                        // Use manual AOW calculation for user (no PDF data)
                        // Check if user has reached AOW age and calculate pro-rata
                        userAowFraction = getAOWFraction(birthDate, aowAge, year);
                        if (userAowFraction > 0) {
                            userAowActive = true;
                            const inflatedAowAmount = aowAmount * Math.pow(1 + inflationCorrection, i - 1);
                            aowDeduction += inflatedAowAmount * userAowFraction;
                        }
                    }

                    // Partner AOW: from PDF if available and uploaded, otherwise manual
                    if (deductAOW && hasPartner && withdrawalIsCombined) {
                        // Check if partner PDF was uploaded and has AOW data
                        if (wantToUploadPartnerPDF === true && partnerAowDataFromPDF && partnerBirthDate) {
                            // Use partner AOW from PDF
                            partnerAowFraction = getAOWFraction(partnerBirthDate, partnerAowAge, year);
                            if (partnerAowFraction > 0) {
                                partnerAowActive = true;
                                partnerAowFromPDF = partnerAowDataFromPDF.amount * partnerAowFraction;
                                aowDeduction += partnerAowFromPDF;
                            }
                        } else {
                            // Use manual calculation for partner
                            partnerAowFraction = getAOWFraction(partnerBirthDate, partnerAowAge, year);
                            if (partnerAowFraction > 0) {
                                partnerAowActive = true;
                                partnerAowFromManual = partnerAowAmount * partnerAowFraction;
                                aowDeduction += partnerAowFromManual;
                            }
                        }
                    }

                    // Deduct AOW and pension from withdrawal (but don't go negative)
                    inflatedWithdrawal = Math.max(0, inflatedWithdrawal - aowDeduction - pensionIncome);
                    totalAowDeduction += aowDeduction;
                    totalPensionIncome += pensionIncome;

                    // Present value calculation based on savings period and investment profile
                    let presentValue;

                    if (i <= savingsPeriod) {
                        // During savings period: discount at 1.5%
                        presentValue = inflatedWithdrawal / Math.pow(1 + savingsInterest, i);
                    } else {
                        // After savings period: first discount savings years, then investment years
                        const savingsDiscountFactor = Math.pow(1 + savingsInterest, savingsPeriod);
                        const investmentYears = i - savingsPeriod;
                        const investmentDiscountFactor = Math.pow(1 + discountRate, investmentYears);
                        presentValue = inflatedWithdrawal / (savingsDiscountFactor * investmentDiscountFactor);
                    }

                    const difference = inflatedWithdrawal - presentValue;

                    yearByYear.push({
                        year,
                        period: i,
                        inflatedWithdrawal: inflatedWithdrawal + aowDeduction + pensionIncome, // Store gross withdrawal (before AOW and pension deduction)
                        netWithdrawal: inflatedWithdrawal, // Net withdrawal after AOW and pension deduction
                        aowDeduction,
                        aowFromPDF, // Track AOW from PDF separately (user only)
                        partnerAowFromManual, // Track partner AOW from manual calculation
                        partnerAowFromPDF, // Track partner AOW from PDF
                        pensionIncome,
                        userAowActive,
                        partnerAowActive,
                        userAowFraction,
                        partnerAowFraction,
                        presentValue,
                        difference
                    });

                    totalWithdrawals += inflatedWithdrawal;
                    totalPresentValue += presentValue;
                }

                // Calculate remaining after withdrawals
                const remainingAfterWithdrawals = futureValue - totalPresentValue;

                // Calculate future value of remaining amount after withdrawal period
                const finalValue = remainingAfterWithdrawals * Math.pow(1 + withdrawalReturn, withdrawalPeriod);

                setResults({
                    buildUpReturn,
                    withdrawalReturn,
                    futureValue,
                    totalWithdrawals,
                    totalPresentValue,
                    remainingAfterWithdrawals,
                    finalValue,
                    yearByYear,
                    withdrawalPeriod,
                    savingsPeriod,
                    discountProfile,
                    discountRate,
                    totalAowDeduction,
                    totalPensionIncome,
                    deductAOW,
                    withdrawalIsCombined,
                    hasPartner,
                    hasPensionData: pensionData !== null,
                    hasAowDataFromPDF: aowDataFromPDF !== null,
                    usePDFData: usePDFData
                });
            };

            const formatCurrency = (value) => {
                return new Intl.NumberFormat('nl-NL', {
                    style: 'currency',
                    currency: 'EUR',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }).format(value);
            };

            const formatPercent = (value) => {
                return new Intl.NumberFormat('nl-NL', {
                    style: 'percent',
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1
                }).format(value);
            };

            const showAOWDetails = () => {
                const modalData = {
                    type: 'aow',
                    usePDF: wantToUploadPDF === true && usePDFData && aowDataFromPDF !== null,
                    pdfData: aowDataFromPDF,
                    usePartnerPDF: wantToUploadPartnerPDF === true && partnerAowDataFromPDF !== null,
                    partnerPdfData: partnerAowDataFromPDF,
                    manualData: {
                        userAmount: aowAmount,
                        userAge: aowAge,
                        userDate: aowDate,
                        hasPartner: hasPartner,
                        partnerAmount: partnerAowAmount,
                        partnerAge: partnerAowAge,
                        partnerDate: partnerAowDate,
                        withdrawalIsCombined: withdrawalIsCombined
                    }
                };
                setModalContent(modalData);
                setShowModal(true);
            };

            const showAOWYearDetails = (yearData) => {
                const modalData = {
                    type: 'aow-year',
                    yearData: yearData,
                    usePDF: wantToUploadPDF === true && usePDFData && aowDataFromPDF !== null,
                    pdfData: aowDataFromPDF,
                    usePartnerPDF: wantToUploadPartnerPDF === true && partnerAowDataFromPDF !== null,
                    partnerPdfData: partnerAowDataFromPDF,
                    inflationCorrection: inflationCorrection,
                    startYear: year,
                    manualData: {
                        userAmount: aowAmount,
                        userAge: aowAge,
                        userDate: aowDate,
                        hasPartner: hasPartner,
                        partnerAmount: partnerAowAmount,
                        partnerAge: partnerAowAge,
                        partnerDate: partnerAowDate,
                        withdrawalIsCombined: withdrawalIsCombined
                    }
                };
                setModalContent(modalData);
                setShowModal(true);
            };

            const showPensionDetails = () => {
                if (pensionData) {
                    setModalContent({
                        type: 'pension',
                        data: pensionData
                    });
                    setShowModal(true);
                }
            };

            const showPresentValueDetails = () => {
                setModalContent({
                    type: 'present-value',
                    results: results,
                    savingsPeriod: savingsPeriod,
                    discountProfile: discountProfile,
                    savingsInterest: savingsInterest
                });
                setShowModal(true);
            };

            const showWithdrawalsBreakdown = () => {
                setModalContent({
                    type: 'withdrawals-breakdown',
                    results: results
                });
                setShowModal(true);
            };

            const generatePDFReport = () => {
                try {
                    // Check if html2pdf is available
                    if (typeof html2pdf === 'undefined') {
                        alert('PDF library is nog aan het laden. Probeer het over een paar seconden opnieuw.');
                        return;
                    }

                    // Create a compact PDF report with summary and withdrawals
                    const wrapper = document.createElement('div');
                    wrapper.style.padding = '15px';
                    wrapper.style.backgroundColor = '#0a1e3d';
                    wrapper.style.fontFamily = 'Arial, sans-serif';
                    wrapper.style.fontSize = '9px';

                    // Build the report HTML
                    let withdrawalsHTML = '';
                    results.yearByYear.forEach((row, idx) => {
                        withdrawalsHTML += `
                            <div style="display: flex; justify-content: space-between; padding: 5px 10px; background-color: ${idx % 2 === 0 ? '#1e293b' : '#0f172a'}; border-radius: 4px; margin-bottom: 2px;">
                                <div>
                                    <span style="color: #14b8a6; font-weight: bold; font-size: 10px;">${row.year}</span>
                                    <span style="color: #94a3b8; font-size: 9px; margin-left: 8px;">(${row.userAge}${row.partnerAge ? ` / ${row.partnerAge}` : ''})</span>
                                </div>
                                <div style="color: white; font-weight: bold; font-size: 10px;">${formatCurrency(row.presentValue)}</div>
                            </div>
                        `;
                    });

                    wrapper.innerHTML = `
                        <div>
                            <!-- Header -->
                            <div style="margin-bottom: 15px; padding-bottom: 10px; border-bottom: 3px solid #14b8a6;">
                                <h1 style="color: white; font-size: 20px; font-weight: bold; margin: 0 0 5px 0;">Vermogensbehoud Rapport</h1>
                                <p style="color: #93c5fd; font-size: 11px; margin: 0;">Client: ${name} | Datum: ${new Date().toLocaleDateString('nl-NL')}</p>
                            </div>

                            <!-- Step 1 & 2 Summary - Combined -->
                            <div style="background-color: #1e293b; border: 1px solid #475569; border-radius: 6px; padding: 12px; margin-bottom: 12px;">
                                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; font-size: 10px;">
                                    <div>
                                        <span style="color: #94a3b8;">Naam:</span>
                                        <span style="color: white; margin-left: 5px; font-weight: bold;">${name}</span>
                                    </div>
                                    <div>
                                        <span style="color: #94a3b8;">Geboortedatum:</span>
                                        <span style="color: white; margin-left: 5px; font-weight: bold;">${new Date(birthDate).toLocaleDateString('nl-NL')}</span>
                                    </div>
                                    <div>
                                        <span style="color: #94a3b8;">Partner:</span>
                                        <span style="color: white; margin-left: 5px; font-weight: bold;">${hasPartner ? 'Ja' : 'Nee'}${hasPartner && partnerBirthDate ? ` (${new Date(partnerBirthDate).toLocaleDateString('nl-NL')})` : ''}</span>
                                    </div>
                                    <div>
                                        <span style="color: #94a3b8;">Onttrekkingsperiode:</span>
                                        <span style="color: white; margin-left: 5px; font-weight: bold;">${withdrawalDuration}</span>
                                    </div>
                                    <div>
                                        <span style="color: #94a3b8;">Startbedrag:</span>
                                        <span style="color: white; margin-left: 5px; font-weight: bold;">${formatCurrency(lumpSum)}</span>
                                    </div>
                                    <div>
                                        <span style="color: #94a3b8;">Gewenst inkomen:</span>
                                        <span style="color: white; margin-left: 5px; font-weight: bold;">${formatCurrency(withdrawalAmount)}</span>
                                    </div>
                                    <div>
                                        <span style="color: #94a3b8;">Opbouwperiode:</span>
                                        <span style="color: white; margin-left: 5px; font-weight: bold;">${savingsPeriod}</span>
                                    </div>
                                    <div>
                                        <span style="color: #94a3b8;">Inflatie:</span>
                                        <span style="color: white; margin-left: 5px; font-weight: bold;">${formatPercent(inflationCorrection)}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Withdrawals -->
                            <div style="background-color: #1e293b; border: 1px solid #475569; border-radius: 6px; padding: 12px; margin-bottom: 12px;">
                                <h2 style="color: #14b8a6; font-size: 13px; font-weight: bold; margin: 0 0 8px 0;">Jaarlijkse Onttrekkingen (Contante Waarde)</h2>
                                <div style="max-height: 400px; overflow-y: auto;">
                                    ${withdrawalsHTML}
                                </div>
                                <div style="margin-top: 8px; padding-top: 8px; border-top: 2px solid #14b8a6; display: flex; justify-content: space-between; align-items: center;">
                                    <span style="color: #14b8a6; font-weight: bold; font-size: 11px;">TOTAAL</span>
                                    <span style="color: white; font-weight: bold; font-size: 13px;">${formatCurrency(results.totalPresentValue)}</span>
                                </div>
                            </div>

                            <!-- Vermogensontwikkeling -->
                            <div style="background-color: #1e293b; border: 1px solid #475569; border-radius: 8px; padding: 20px;">
                                <h2 style="color: #14b8a6; font-size: 14px; font-weight: bold; margin: 0 0 20px 0;">Vermogensontwikkeling</h2>
                                <div style="display: flex; align-items: center; justify-content: space-between; padding: 0 15px;">
                                    <!-- Start Amount -->
                                    <div style="text-align: center;">
                                        <div style="background-color: #1e293b; border-radius: 8px; padding: 10px 15px; border: 1px solid #475569; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">
                                            <div style="color: #94a3b8; font-size: 9px; margin-bottom: 4px;">Start</div>
                                            <div style="color: white; font-weight: bold; font-size: 12px;">${formatCurrency(lumpSum)}</div>
                                        </div>
                                    </div>

                                    <!-- Arrow 1 -->
                                    <div style="flex: 1; margin: 0 15px; min-width: 150px;">
                                        <div style="background: linear-gradient(to right, #475569, #334155); padding: 12px 20px; border: 1px solid #475569; box-shadow: 0 4px 6px rgba(0,0,0,0.2); clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 50%, calc(100% - 20px) 100%, 0 100%);">
                                            <div style="color: #cbd5e1; font-size: 9px; font-weight: bold; text-align: center;">
                                                Doelrendement: ${formatPercent(results.buildUpReturn)}
                                            </div>
                                            <div style="color: #94a3b8; font-size: 9px; text-align: center;">
                                                ${period}
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Future Value -->
                                    <div style="text-align: center;">
                                        <div style="background-color: #1e293b; border-radius: 8px; padding: 10px 15px; border: 1px solid #475569; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">
                                            <div style="color: #94a3b8; font-size: 9px; margin-bottom: 4px;">Na opbouw</div>
                                            <div style="color: white; font-weight: bold; font-size: 12px;">${formatCurrency(results.futureValue)}</div>
                                        </div>
                                    </div>

                                    <!-- Split Arrows -->
                                    <div style="display: flex; flex-direction: column; align-items: flex-start; justify-content: center; margin-left: 25px; gap: 30px;">
                                        <!-- Upper arrow - Withdrawals -->
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <div style="background: linear-gradient(to right, #475569, #334155); padding: 6px 12px; border: 1px solid #475569; box-shadow: 0 2px 4px rgba(0,0,0,0.2); width: 80px; clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%);">
                                                <div style="color: #cbd5e1; font-size: 9px; font-weight: bold; text-align: center;">Opnames</div>
                                            </div>
                                            <div style="background-color: #1e293b; border-radius: 6px; padding: 6px 10px; border: 1px solid #475569; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">
                                                <div style="color: white; font-weight: bold; font-size: 10px;">${formatCurrency(results.totalPresentValue)}</div>
                                            </div>
                                        </div>

                                        <!-- Lower arrow - Remaining -->
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <div style="background: linear-gradient(to right, #475569, #334155); padding: 6px 12px; border: 1px solid #475569; box-shadow: 0 2px 4px rgba(0,0,0,0.2); width: 80px; clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%);">
                                                <div style="color: #cbd5e1; font-size: 9px; font-weight: bold; text-align: center;">Restant</div>
                                            </div>
                                            <div style="background-color: #1e293b; border-radius: 6px; padding: 6px 10px; border: 1px solid #475569; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">
                                                <div style="color: white; font-weight: bold; font-size: 10px;">${formatCurrency(results.remainingAfterWithdrawals)}</div>
                                            </div>

                                            <!-- Arrow 2 - inline with lower path -->
                                            <div style="flex: 1; margin: 0 15px; min-width: 150px;">
                                                <div style="background: linear-gradient(to right, #475569, #334155); padding: 12px 20px; border: 1px solid #475569; box-shadow: 0 4px 6px rgba(0,0,0,0.2); clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 50%, calc(100% - 20px) 100%, 0 100%);">
                                                    <div style="color: #cbd5e1; font-size: 9px; font-weight: bold; text-align: center;">
                                                        Doelrendement ${formatPercent(results.withdrawalReturn)}
                                                    </div>
                                                    <div style="color: #94a3b8; font-size: 9px; text-align: center;">
                                                        ${results.withdrawalPeriod}
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- Final Value - inline with lower path -->
                                            <div style="text-align: center;">
                                                <div style="background-color: #1e293b; border-radius: 8px; padding: 10px 15px; border: 1px solid #475569; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">
                                                    <div style="color: #94a3b8; font-size: 9px; margin-bottom: 4px;">Eindwaarde</div>
                                                    <div style="color: white; font-weight: bold; font-size: 12px;">${formatCurrency(results.finalValue)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;

                    const opt = {
                        margin: [8, 8, 8, 8],
                        filename: `Vermogensbehoud_Rapport_${name.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('nl-NL').replace(/\//g, '-')}.pdf`,
                        image: { type: 'jpeg', quality: 0.98 },
                        html2canvas: {
                            scale: 2,
                            useCORS: true,
                            logging: false,
                            backgroundColor: '#0a1e3d'
                        },
                        jsPDF: {
                            unit: 'mm',
                            format: 'a4',
                            orientation: 'portrait'
                        },
                        pagebreak: { mode: 'avoid-all' }
                    };

                    html2pdf().set(opt).from(wrapper).save();
                } catch (error) {
                    console.error('PDF Error:', error);
                    alert('Er is een fout opgetreden bij het genereren van de PDF: ' + error.message);
                }
            };

            return (
                <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
                    {/* Spacer to prevent content from going under fixed navbar */}
                    <div style={{ height: '72px' }}></div>

                    {/* Fixed Navigation Bar - Same as other pages */}
                    <nav className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 shadow-lg fixed top-0 left-0 right-0 z-50">
                        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
                            <div className="flex justify-between items-center">
                                {onNavigate ? (
                                    <button onClick={() => onNavigate('welcome')} className="flex items-center gap-2 sm:gap-3">
                                        <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12">
                                            <path d="M 12 20 Q 12 14 18 14 L 30 14 Q 36 14 36 20 L 36 28 Q 36 34 30 34 L 18 34 Q 12 34 12 28 Z" fill="#28EBCF"/>
                                            <rect x="20" y="10" width="8" height="2" rx="1" fill="#1a5f54"/>
                                            <circle cx="24" cy="6" r="4" fill="#FFD700"/>
                                            <text x="24" y="8.5" fontSize="5" fill="#B8860B" fontWeight="bold" textAnchor="middle">€</text>
                                            <path d="M 20 14 Q 20 10 24 10 Q 28 10 28 14" stroke="#1a5f54" strokeWidth="1.5" fill="none"/>
                                            <circle cx="20" cy="22" r="1.2" fill="#1a5f54"/>
                                            <circle cx="28" cy="22" r="1.2" fill="#1a5f54"/>
                                            <ellipse cx="24" cy="26" rx="3" ry="2.5" fill="#20D4BA"/>
                                            <circle cx="23" cy="26" r="0.6" fill="#1a5f54"/>
                                            <circle cx="25" cy="26" r="0.6" fill="#1a5f54"/>
                                            <path d="M 16 16 Q 14 17 15 20" stroke="#20D4BA" strokeWidth="2" fill="none" strokeLinecap="round"/>
                                            <path d="M 32 16 Q 34 17 33 20" stroke="#20D4BA" strokeWidth="2" fill="none" strokeLinecap="round"/>
                                            <path d="M 20 28 Q 24 30 28 28" stroke="#1a5f54" strokeWidth="1" fill="none" strokeLinecap="round"/>
                                            <circle cx="18" cy="34" r="2" fill="#20D4BA"/>
                                            <circle cx="30" cy="34" r="2" fill="#20D4BA"/>
                                        </svg>
                                        <div className="text-lg sm:text-2xl md:text-3xl font-bold text-white">PIGG</div>
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12">
                                            <path d="M 12 20 Q 12 14 18 14 L 30 14 Q 36 14 36 20 L 36 28 Q 36 34 30 34 L 18 34 Q 12 34 12 28 Z" fill="#28EBCF"/>
                                            <rect x="20" y="10" width="8" height="2" rx="1" fill="#1a5f54"/>
                                            <circle cx="24" cy="6" r="4" fill="#FFD700"/>
                                            <text x="24" y="8.5" fontSize="5" fill="#B8860B" fontWeight="bold" textAnchor="middle">€</text>
                                            <path d="M 20 14 Q 20 10 24 10 Q 28 10 28 14" stroke="#1a5f54" strokeWidth="1.5" fill="none"/>
                                            <circle cx="20" cy="22" r="1.2" fill="#1a5f54"/>
                                            <circle cx="28" cy="22" r="1.2" fill="#1a5f54"/>
                                            <ellipse cx="24" cy="26" rx="3" ry="2.5" fill="#20D4BA"/>
                                            <circle cx="23" cy="26" r="0.6" fill="#1a5f54"/>
                                            <circle cx="25" cy="26" r="0.6" fill="#1a5f54"/>
                                            <path d="M 16 16 Q 14 17 15 20" stroke="#20D4BA" strokeWidth="2" fill="none" strokeLinecap="round"/>
                                            <path d="M 32 16 Q 34 17 33 20" stroke="#20D4BA" strokeWidth="2" fill="none" strokeLinecap="round"/>
                                            <path d="M 20 28 Q 24 30 28 28" stroke="#1a5f54" strokeWidth="1" fill="none" strokeLinecap="round"/>
                                            <circle cx="18" cy="34" r="2" fill="#20D4BA"/>
                                            <circle cx="30" cy="34" r="2" fill="#20D4BA"/>
                                        </svg>
                                        <div className="text-lg sm:text-2xl md:text-3xl font-bold text-white">PIGG</div>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
                                    {onNavigate && (
                                        <>
                                            <button onClick={() => onNavigate('welcome')} className="text-gray-400 hover:text-white text-xs sm:text-sm md:text-base">Home</button>
                                            <button onClick={() => onNavigate('dashboard')} className="text-gray-400 hover:text-white text-xs sm:text-sm md:text-base">Mijn Portefeuille</button>
                                            <button onClick={() => onNavigate('incomeCalculator')} className="text-[#28EBCF] font-medium text-xs sm:text-sm md:text-base">Jouw Plan</button>
                                            <button onClick={() => onNavigate('etfDatabase')} className="text-gray-400 hover:text-white text-xs sm:text-sm md:text-base">ETF Database</button>
                                            <button onClick={() => onNavigate('financialNews')} className="text-gray-400 hover:text-white text-xs sm:text-sm md:text-base">Nieuws</button>
                                        </>
                                    )}
                                    {onLogout && (
                                        <button onClick={onLogout} className="text-gray-400 hover:text-white font-medium text-xs sm:text-sm md:text-base">
                                            Uitloggen
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </nav>

                    <div className={`mx-auto px-4 py-4 ${currentStep === 3 ? 'max-w-[95%]' : 'max-w-5xl'}`}>
                        {/* Page Title */}
                        <div className="mb-6">
                            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Vermogensbehoud Calculator</h1>
                            <p className="text-sm sm:text-base text-gray-400">Plan uw spaar- en opnamestrategie met precisie</p>
                        </div>

                        <div className="bg-[#1a2332] rounded-2xl shadow-2xl overflow-hidden border border-slate-700">

                            {/* Step Indicator */}
                            {currentStep !== 3 && (
                                <div className="px-6 pt-4 pb-3 border-b border-slate-700">
                                    <div className="flex items-center justify-center gap-2">
                                        <div className={`flex items-center ${currentStep >= 0 ? 'text-teal-400' : 'text-slate-500'}`}>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${currentStep >= 0 ? 'bg-teal-500 text-slate-900' : 'bg-slate-700 text-slate-400'}`}>1</div>
                                            <span className="ml-2 font-medium text-xs">Persoonlijk</span>
                                        </div>
                                        <div className="w-8 h-0.5 bg-slate-700"></div>
                                        <div className={`flex items-center ${currentStep >= 1 ? 'text-teal-400' : 'text-slate-500'}`}>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${currentStep >= 1 ? 'bg-teal-500 text-slate-900' : 'bg-slate-700 text-slate-400'}`}>2</div>
                                            <span className="ml-2 font-medium text-xs">Opbouw</span>
                                        </div>
                                        <div className="w-8 h-0.5 bg-slate-700"></div>
                                        <div className={`flex items-center ${currentStep >= 2 ? 'text-teal-400' : 'text-slate-500'}`}>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${currentStep >= 2 ? 'bg-teal-500 text-slate-900' : 'bg-slate-700 text-slate-400'}`}>3</div>
                                            <span className="ml-2 font-medium text-xs">Opname</span>
                                        </div>
                                        <div className="w-8 h-0.5 bg-slate-700"></div>
                                        <div className={`flex items-center ${currentStep >= 3 ? 'text-teal-400' : 'text-slate-500'}`}>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${currentStep >= 3 ? 'bg-teal-500 text-slate-900' : 'bg-slate-700 text-slate-400'}`}>4</div>
                                            <span className="ml-2 font-medium text-xs">Dashboard</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="p-6">
                                {/* STEP 0: Personal Information */}
                                {currentStep === 0 && (
                                    <div className="max-w-2xl mx-auto">
                                        <h2 className="text-2xl font-bold text-white mb-4">Persoonlijke Gegevens</h2>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 mb-1">Naam</label>
                                                <input
                                                    type="text"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                                                    placeholder="Bijv. Henk"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 mb-1">Geboortedatum</label>
                                                <input
                                                    type="date"
                                                    value={birthDate}
                                                    onChange={(e) => setBirthDate(e.target.value)}
                                                    className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                                                />
                                            </div>
                                        </div>

                                        {birthDate && aowAge && aowDate && (
                                            <div className="mt-4 p-4 bg-slate-700 rounded-lg border border-slate-600">
                                                <p className="text-sm text-slate-300">
                                                    <strong className="text-teal-400">AOW-leeftijd:</strong> {formatAOWAge(aowAge)} ({formatAOWDate(aowDate)})
                                                </p>
                                            </div>
                                        )}

                                        {birthDate && (
                                            <div className="mt-6">
                                                <h3 className="text-lg font-semibold text-white mb-3">Welke berekening wilt u maken?</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div
                                                        onClick={() => setCalculationMode('buildup')}
                                                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                                            calculationMode === 'buildup'
                                                                ? 'border-teal-500 bg-teal-500/10'
                                                                : 'border-slate-600 bg-slate-800 hover:border-slate-500'
                                                        }`}
                                                    >
                                                        <h4 className="font-bold text-white mb-2">Opbouwberekening</h4>
                                                        <p className="text-xs text-slate-400">
                                                            Bereken hoeveel vermogen u opbouwt met een bepaalde inleg over een periode.
                                                        </p>
                                                    </div>
                                                    <div
                                                        onClick={() => setCalculationMode('reverse')}
                                                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                                            calculationMode === 'reverse'
                                                                ? 'border-teal-500 bg-teal-500/10'
                                                                : 'border-slate-600 bg-slate-800 hover:border-slate-500'
                                                        }`}
                                                    >
                                                        <h4 className="font-bold text-white mb-2">Vermogensbehoefteberekening</h4>
                                                        <p className="text-xs text-slate-400">
                                                            Bereken hoeveel vermogen u nodig heeft om een gewenst inkomen te realiseren.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-6 flex justify-end">
                                            <button
                                                onClick={handleStep0Next}
                                                disabled={!name || !birthDate || !calculationMode}
                                                className="px-6 py-2 text-sm bg-teal-500 text-slate-900 font-bold rounded-lg hover:bg-teal-400 transition-colors shadow-lg disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed"
                                            >
                                                Volgende →
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 0.5: Reverse Calculation (Vermogensbehoefteberekening) */}
                                {currentStep === 0.5 && (
                                    <div className="max-w-2xl mx-auto">
                                        <h2 className="text-2xl font-bold text-white mb-4">Vermogensbehoefteberekening</h2>
                                        <p className="text-sm text-slate-400 mb-6">
                                            Vul hieronder uw gewenste inkomen en periode in. De calculator berekent hoeveel vermogen u nodig heeft.
                                        </p>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 mb-1">
                                                    Over hoeveel jaar wilt u stoppen met werken?
                                                </label>
                                                <input
                                                    type="number"
                                                    value={reverseYearsUntilRetirement}
                                                    onChange={(e) => setReverseYearsUntilRetirement(Number(e.target.value))}
                                                    className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                                                    min="0"
                                                    max="50"
                                                    placeholder="bijv. 15"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 mb-1">
                                                    Gewenst jaarinkomen (€)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formatNumber(reverseTargetIncome)}
                                                    onChange={(e) => handleNumberChange(e.target.value, setReverseTargetIncome)}
                                                    className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                                                    placeholder="bijv. 50.000"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 mb-1">
                                                    Hoeveel jaar wilt u dit inkomen onttrekken?
                                                </label>
                                                <input
                                                    type="number"
                                                    value={reverseWithdrawalDuration}
                                                    onChange={(e) => setReverseWithdrawalDuration(Number(e.target.value))}
                                                    className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                                                    min="1"
                                                    max="50"
                                                    placeholder="bijv. 20"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 mb-1">Beleggingsprofiel tijdens onttrekking</label>
                                                <select
                                                    value={reverseInvestmentProfile}
                                                    onChange={(e) => setReverseInvestmentProfile(e.target.value)}
                                                    className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                                                >
                                                    {Object.keys(InvestmentProfiles).map(profile => (
                                                        <option key={profile} value={profile}>
                                                            {profile} ({(InvestmentProfiles[profile] * 100).toFixed(1)}%)
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 mb-1">
                                                    Huidig vermogen (€)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formatNumber(reverseCurrentCapital)}
                                                    onChange={(e) => handleNumberChange(e.target.value, setReverseCurrentCapital)}
                                                    className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                                                    placeholder="bijv. 100.000 (optioneel)"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 mb-1">Beleggingsprofiel tot stoppen met werken</label>
                                                <select
                                                    value={reverseBuildUpProfile}
                                                    onChange={(e) => setReverseBuildUpProfile(e.target.value)}
                                                    className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                                                >
                                                    {Object.keys(InvestmentProfiles).map(profile => (
                                                        <option key={profile} value={profile}>
                                                            {profile} ({(InvestmentProfiles[profile] * 100).toFixed(1)}%)
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="mt-6 space-y-4">
                                            <div>
                                                <label className="flex items-center space-x-3 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={reverseApplyInflation}
                                                        onChange={(e) => setReverseApplyInflation(e.target.checked)}
                                                        className="w-4 h-4 text-teal-500 bg-slate-800 border-slate-600 rounded focus:ring-2 focus:ring-teal-500"
                                                    />
                                                    <span className="text-sm text-slate-300">
                                                        Pas inflatiecorrectie toe tijdens uitkering
                                                    </span>
                                                </label>
                                                <p className="text-xs text-slate-400 mt-2 ml-7">
                                                    Als u dit aanvinkt, wordt het jaarinkomen jaarlijks verhoogd met 2% inflatie tijdens de onttrekperiode.
                                                    Bijvoorbeeld bij €50.000: jaar 1 = €51.000, jaar 2 = €52.020, jaar 3 = €53.060, etc.
                                                </p>
                                            </div>

                                            <div>
                                                <label className="flex items-center space-x-3 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={reverseDeductAOWPension}
                                                        onChange={(e) => setReverseDeductAOWPension(e.target.checked)}
                                                        className="w-4 h-4 text-teal-500 bg-slate-800 border-slate-600 rounded focus:ring-2 focus:ring-teal-500"
                                                    />
                                                    <span className="text-sm text-slate-300">
                                                        Trek AOW en pensioen af van het gewenste inkomen
                                                    </span>
                                                </label>
                                                <p className="text-xs text-slate-400 mt-2 ml-7">
                                                    Als u dit aanvinkt, wordt uw AOW en eventueel pensioen afgetrokken van het gewenste inkomen vanaf het moment dat u deze ontvangt.
                                                </p>
                                            </div>
                                        </div>

                                        {reverseYearsUntilRetirement > 0 && birthDate && (
                                            <div className="mt-4 p-4 bg-slate-700 rounded-lg border border-slate-600">
                                                <p className="text-sm text-slate-300">
                                                    <strong className="text-teal-400">U stopt met werken op:</strong> {calculateAgeAtYear(birthDate, new Date().getFullYear() + parseInt(reverseYearsUntilRetirement))} jaar ({new Date().getFullYear() + parseInt(reverseYearsUntilRetirement)})
                                                </p>
                                                {aowAge && (
                                                    <p className="text-sm text-slate-300 mt-1">
                                                        <strong className="text-teal-400">U bereikt AOW-leeftijd op:</strong> {formatAOWAge(aowAge)} ({formatAOWDate(aowDate)})
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        <div className="mt-6 flex justify-between">
                                            <button
                                                onClick={handleBack}
                                                className="px-4 py-2 text-sm text-slate-400 hover:text-white font-semibold transition-colors"
                                            >
                                                ← Terug
                                            </button>
                                            <button
                                                onClick={() => {
                                                    calculateResults();
                                                    setCurrentStep(3);
                                                }}
                                                disabled={!reverseTargetIncome || !reverseYearsUntilRetirement || !reverseWithdrawalDuration}
                                                className="px-6 py-2 text-sm bg-teal-500 text-slate-900 font-bold rounded-lg hover:bg-teal-400 transition-colors shadow-lg disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed"
                                            >
                                                Bereken →
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 1: Build-up Period */}
                                {currentStep === 1 && (
                                    <div className="max-w-2xl mx-auto">
                                        <h2 className="text-2xl font-bold text-white mb-4">Opbouwperiode</h2>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 mb-1">Beleggingsprofiel</label>
                                                <select
                                                    value={buildUpProfile}
                                                    onChange={(e) => setBuildUpProfile(e.target.value)}
                                                    className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                                                >
                                                    {Object.keys(InvestmentProfiles).map(profile => (
                                                        <option key={profile} value={profile}>
                                                            {profile} ({formatPercent(InvestmentProfiles[profile])})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 mb-1">Periode (jaren)</label>
                                                <input
                                                    type="number"
                                                    value={period}
                                                    onChange={(e) => setPeriod(Number(e.target.value))}
                                                    className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                                                    min="1"
                                                    max="50"
                                                    placeholder="bijv. 12"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 mb-1">Periodieke Storting (€)</label>
                                                <input
                                                    type="text"
                                                    value={formatNumber(periodicDeposit)}
                                                    onChange={(e) => handleNumberChange(e.target.value, setPeriodicDeposit)}
                                                    className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                                                    placeholder="bijv. 2.000"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 mb-1">Eenmalige Storting (€)</label>
                                                <input
                                                    type="text"
                                                    value={formatNumber(lumpSum)}
                                                    onChange={(e) => handleNumberChange(e.target.value, setLumpSum)}
                                                    className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                                                    placeholder="bijv. 300.000"
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-6 flex justify-between">
                                            <button
                                                onClick={handleBack}
                                                className="px-4 py-2 text-sm text-slate-400 hover:text-white font-semibold transition-colors"
                                            >
                                                ← Terug
                                            </button>
                                            <button
                                                onClick={handleStep1Next}
                                                className="px-6 py-2 text-sm bg-teal-500 text-slate-900 font-bold rounded-lg hover:bg-teal-400 transition-colors shadow-lg"
                                            >
                                                Volgende →
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 1.5: Withdrawal Question */}
                                {currentStep === 1.5 && (
                                    <div className="max-w-xl mx-auto text-center py-8">
                                        <h2 className="text-2xl font-bold text-white mb-3">Wilt u een opnameperiode toevoegen?</h2>
                                        <p className="text-slate-400 mb-6 text-sm">Kies of u regelmatige opnames uit uw belegging wilt plannen.</p>

                                        <div className="flex gap-4 justify-center">
                                            <button
                                                onClick={() => handleWithdrawalDecision(true)}
                                                className="px-12 py-3 bg-teal-500 text-slate-900 font-bold rounded-lg hover:bg-teal-400 transition-all shadow-lg text-base"
                                            >
                                                Ja
                                            </button>
                                            <button
                                                onClick={() => handleWithdrawalDecision(false)}
                                                className="px-12 py-3 bg-slate-700 text-white font-bold rounded-lg hover:bg-slate-600 transition-all shadow-lg text-base border border-slate-600"
                                            >
                                                Nee
                                            </button>
                                        </div>

                                        <div className="mt-6">
                                            <button
                                                onClick={handleBack}
                                                className="px-4 py-2 text-sm text-slate-400 hover:text-white font-medium transition-colors"
                                            >
                                                ← Terug
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 2: Withdrawal Period */}
                                {currentStep === 2 && (
                                    <div className="max-w-2xl mx-auto">
                                        <h2 className="text-2xl font-bold text-white mb-4">Opnameperiode</h2>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 mb-1">Jaarlijkse Opname (€)</label>
                                                <input
                                                    type="text"
                                                    value={formatNumber(withdrawalAmount)}
                                                    onChange={(e) => handleNumberChange(e.target.value, setWithdrawalAmount)}
                                                    className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                                                    placeholder="bijv. 50.000"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 mb-1">Beleggingsprofiel</label>
                                                <select
                                                    value={withdrawalProfile}
                                                    onChange={(e) => setWithdrawalProfile(e.target.value)}
                                                    className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                                                >
                                                    {Object.keys(InvestmentProfiles).map(profile => (
                                                        <option key={profile} value={profile}>
                                                            {profile} ({formatPercent(InvestmentProfiles[profile])})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="md:col-span-2 p-4 bg-blue-900 bg-opacity-20 rounded-lg border border-blue-700">
                                                <p className="text-xs text-blue-200 mb-3">
                                                    ℹ️ <strong>Let op:</strong> De uitkeringsperiode sluit automatisch aan op het einde van de opbouwperiode{year && ` (jaar ${year})`}.
                                                    U hoeft alleen de duur van de uitkeringen op te geven.
                                                </p>
                                                <label className="block text-xs font-semibold text-slate-400 mb-1">
                                                    Duur uitkeringsperiode (in jaren)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={withdrawalDuration}
                                                    onChange={(e) => setWithdrawalDuration(Number(e.target.value))}
                                                    className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                                                    min="1"
                                                    max="50"
                                                    placeholder="bijv. 20"
                                                />
                                                {year && (
                                                    <p className="text-xs text-slate-400 mt-2">
                                                        Uitkeringen lopen van <strong className="text-white">{year}</strong> tot <strong className="text-white">{year + withdrawalDuration}</strong> ({withdrawalDuration} jaar)
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 mb-1">Spaarperiode (jaren à 1,5%)</label>
                                                <input
                                                    type="number"
                                                    value={savingsPeriod}
                                                    onChange={(e) => setSavingsPeriod(Number(e.target.value))}
                                                    className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                                                    min="0"
                                                    placeholder="bijv. 2"
                                                />
                                                <p className="text-xs text-slate-500 mt-1">Eerste jaren sparen voor contante waarde berekening</p>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 mb-1">Beleggingsprofiel CW-berekening</label>
                                                <select
                                                    value={discountProfile}
                                                    onChange={(e) => setDiscountProfile(e.target.value)}
                                                    className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                                                >
                                                    {Object.keys(InvestmentProfiles).map(profile => (
                                                        <option key={profile} value={profile}>
                                                            {profile} ({formatPercent(InvestmentProfiles[profile])})
                                                        </option>
                                                    ))}
                                                </select>
                                                <p className="text-xs text-slate-500 mt-1">Voor resterende jaren na spaarperiode</p>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 mb-1">Inflatie Correctie (%)</label>
                                                <input
                                                    type="number"
                                                    value={inflationCorrection * 100}
                                                    onChange={(e) => setInflationCorrection(Number(e.target.value) / 100)}
                                                    className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                                                    min="0"
                                                    max="20"
                                                    step="0.1"
                                                    placeholder="bijv. 2"
                                                />
                                            </div>
                                        </div>

                                        {/* Pension Upload Section - New Design */}
                                        <div className="mt-6 p-4 bg-slate-700 rounded-lg border border-slate-600">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-lg font-bold text-white">Uw Pensioenoverzicht</h3>
                                                {wantToUploadPDF && (
                                                    <button
                                                        onClick={() => setShowPensionInstructions(true)}
                                                        className="text-teal-400 hover:text-teal-300 text-sm font-semibold flex items-center gap-1"
                                                    >
                                                        <span className="text-lg">ℹ️</span> Hoe vind ik mijn PDF?
                                                    </button>
                                                )}
                                            </div>

                                            <p className="text-sm text-slate-400 mb-4">Wilt u uw pensioenoverzicht uploaden?</p>

                                            <div className="flex gap-3 mb-4">
                                                <button
                                                    onClick={() => {
                                                        setWantToUploadPDF(true);
                                                        setUsePDFData(false);
                                                    }}
                                                    className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                                                        wantToUploadPDF === true
                                                            ? 'bg-teal-500 text-slate-900 border-2 border-teal-400'
                                                            : 'bg-slate-800 text-slate-300 border-2 border-slate-600 hover:border-teal-500'
                                                    }`}
                                                >
                                                    Ja
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setWantToUploadPDF(false);
                                                        setUploadedFileName('');
                                                        setPensionData(null);
                                                        setAowDataFromPDF(null);
                                                        setUsePDFData(false);
                                                    }}
                                                    className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                                                        wantToUploadPDF === false
                                                            ? 'bg-teal-500 text-slate-900 border-2 border-teal-400'
                                                            : 'bg-slate-800 text-slate-300 border-2 border-slate-600 hover:border-teal-500'
                                                    }`}
                                                >
                                                    Nee, gebruik platform berekening
                                                </button>
                                            </div>

                                            {wantToUploadPDF === true && (
                                                <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-slate-600">
                                                    <p className="text-sm text-slate-300 mb-3">Upload uw pensioengegevens (PDF/JSON/XML formaat)</p>

                                                    <div className="relative">
                                                        <input
                                                            type="file"
                                                            accept=".json,.xml,.pdf"
                                                            onChange={(e) => {
                                                                handleFileUpload(e);
                                                                setUsePDFData(true);
                                                            }}
                                                            className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-500 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-500 file:text-slate-900 hover:file:bg-teal-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                                                        />
                                                    </div>

                                                    {uploadedFileName && (
                                                        <div className="mt-3 p-3 bg-slate-700 rounded-lg border border-teal-500">
                                                            <p className="text-xs text-teal-400 font-semibold mb-2">
                                                                ✓ Bestand geüpload: {uploadedFileName}
                                                            </p>

                                                            {aowDataFromPDF && (
                                                                <div className="mt-2 p-2 bg-slate-800 rounded">
                                                                    <p className="text-xs text-amber-400 font-semibold">AOW (bruto)</p>
                                                                    <p className="text-sm text-slate-300">{formatCurrency(aowDataFromPDF.amount)} per jaar</p>
                                                                    <p className="text-xs text-slate-400">Vanaf AOW-leeftijd</p>
                                                                </div>
                                                            )}

                                                            {pensionData && (
                                                                <div className="mt-2 p-2 bg-slate-800 rounded">
                                                                    <p className="text-xs text-blue-400 font-semibold">Pensioen (bruto)</p>
                                                                    <p className="text-sm text-slate-300">{formatCurrency(pensionData.amount)} per jaar</p>
                                                                    <p className="text-xs text-slate-400">Vanaf {pensionData.startAge} jaar</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* AOW Settings Section */}
                                        <div className="mt-6 p-4 bg-slate-700 rounded-lg border border-slate-600">
                                            <h3 className="text-lg font-bold text-white mb-2">AOW Instellingen</h3>
                                            <p className="text-sm text-slate-400 mb-4">Wilt u AOW in mindering brengen op uw gewenste opname?</p>

                                            <p className="text-xs text-slate-400 mb-3">
                                                <strong>Wat betekent dit?</strong> Vanaf het moment dat u AOW ontvangt, hoeft u minder uit uw belegging te halen.
                                                Bijvoorbeeld: als u €50.000 per jaar nodig heeft en €19.000 AOW krijgt, hoeft u slechts €31.000 uit uw belegging te halen.
                                            </p>

                                            <div className="flex gap-3 mb-6">
                                                <button
                                                    onClick={() => setDeductAOW(true)}
                                                    className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                                                        deductAOW === true
                                                            ? 'bg-teal-500 text-slate-900 border-2 border-teal-400'
                                                            : 'bg-slate-800 text-slate-300 border-2 border-slate-600 hover:border-teal-500'
                                                    }`}
                                                >
                                                    Ja
                                                </button>
                                                <button
                                                    onClick={() => setDeductAOW(false)}
                                                    className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                                                        deductAOW === false
                                                            ? 'bg-teal-500 text-slate-900 border-2 border-teal-400'
                                                            : 'bg-slate-800 text-slate-300 border-2 border-slate-600 hover:border-teal-500'
                                                    }`}
                                                >
                                                    Nee
                                                </button>
                                            </div>

                                            {deductAOW && (
                                                <div className="space-y-6">
                                                    {/* Withdrawal is combined */}
                                                    <div>
                                                        <p className="text-sm text-slate-400 mb-3">Is de gewenste opname voor beide partners samen?</p>
                                                        <div className="flex gap-3">
                                                            <button
                                                                onClick={() => setWithdrawalIsCombined(true)}
                                                                className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                                                                    withdrawalIsCombined === true
                                                                        ? 'bg-teal-500 text-slate-900 border-2 border-teal-400'
                                                                        : 'bg-slate-800 text-slate-300 border-2 border-slate-600 hover:border-teal-500'
                                                                }`}
                                                            >
                                                                Ja
                                                            </button>
                                                            <button
                                                                onClick={() => setWithdrawalIsCombined(false)}
                                                                className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                                                                    withdrawalIsCombined === false
                                                                        ? 'bg-teal-500 text-slate-900 border-2 border-teal-400'
                                                                        : 'bg-slate-800 text-slate-300 border-2 border-slate-600 hover:border-teal-500'
                                                                }`}
                                                            >
                                                                Nee
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Your AOW amount - only show if not using PDF */}
                                                    {(wantToUploadPDF === false || !usePDFData) && (
                                                        <div>
                                                            <label className="block text-sm font-semibold text-slate-300 mb-2">
                                                                Uw jaarlijkse AOW bedrag (€)
                                                            </label>
                                                            <p className="text-xs text-slate-400 mb-2">
                                                                SVB juli 2025: {hasPartner ? '€1.103,97/mnd = €13.248/jr (gehuwd)' : '€1.612,44/mnd = €19.349/jr (alleenstaand)'}
                                                            </p>
                                                            <input
                                                                type="text"
                                                                value={formatNumber(aowAmount)}
                                                                onChange={(e) => handleNumberChange(e.target.value, setAowAmount)}
                                                                className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                                                                placeholder={hasPartner ? "13248" : "19349"}
                                                            />
                                                        </div>
                                                    )}

                                                    {/* Has partner */}
                                                    <div>
                                                        <p className="text-sm text-slate-400 mb-2">Heeft u een partner?</p>
                                                        <p className="text-xs text-slate-500 mb-3">
                                                            Dit bepaalt uw AOW tarief: alleenstaand (€19.349/jr) of gehuwd (€13.248/jr)
                                                        </p>
                                                        <div className="flex gap-3">
                                                            <button
                                                                onClick={() => setHasPartner(true)}
                                                                className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                                                                    hasPartner === true
                                                                        ? 'bg-teal-500 text-slate-900 border-2 border-teal-400'
                                                                        : 'bg-slate-800 text-slate-300 border-2 border-slate-600 hover:border-teal-500'
                                                                }`}
                                                            >
                                                                Ja
                                                            </button>
                                                            <button
                                                                onClick={() => setHasPartner(false)}
                                                                className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                                                                    hasPartner === false
                                                                        ? 'bg-teal-500 text-slate-900 border-2 border-teal-400'
                                                                        : 'bg-slate-800 text-slate-300 border-2 border-slate-600 hover:border-teal-500'
                                                                }`}
                                                            >
                                                                Nee
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Partner details */}
                                                    {hasPartner && (
                                                        <div className="space-y-4">
                                                            <div>
                                                                <label className="block text-sm font-semibold text-slate-300 mb-2">Geboortedatum partner</label>
                                                                <input
                                                                    type="date"
                                                                    value={partnerBirthDate}
                                                                    onChange={(e) => setPartnerBirthDate(e.target.value)}
                                                                    className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                                                                />
                                                            </div>

                                                            {partnerAowAge && partnerAowDate && (
                                                                <div className="p-3 bg-slate-800 rounded-lg border border-slate-600">
                                                                    <p className="text-xs text-slate-300">
                                                                        <strong className="text-teal-400">AOW-leeftijd partner:</strong> {formatAOWAge(partnerAowAge)} ({formatAOWDate(partnerAowDate)})
                                                                    </p>
                                                                </div>
                                                            )}

                                                            {/* Partner AOW amount - only if not using PDF */}
                                                            {wantToUploadPartnerPDF === false && (
                                                                <div>
                                                                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                                                                        Jaarlijks AOW bedrag partner (€)
                                                                    </label>
                                                                    <p className="text-xs text-slate-400 mb-2">SVB juli 2025: €1.103,97/mnd = €13.248/jr</p>
                                                                    <input
                                                                        type="text"
                                                                        value={formatNumber(partnerAowAmount)}
                                                                        onChange={(e) => handleNumberChange(e.target.value, setPartnerAowAmount)}
                                                                        className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                                                                        placeholder="13248"
                                                                    />
                                                                </div>
                                                            )}

                                                            {/* Partner Pension Upload Choice */}
                                                            <div className="p-4 bg-slate-600 rounded-lg border border-slate-500">
                                                                <h4 className="text-md font-bold text-white mb-3">Pensioenoverzicht Partner</h4>
                                                                <p className="text-sm text-slate-300 mb-3">Wilt u het pensioenoverzicht van uw partner uploaden?</p>

                                                                <div className="flex gap-3 mb-4">
                                                                    <button
                                                                        onClick={() => setWantToUploadPartnerPDF(true)}
                                                                        className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                                                                            wantToUploadPartnerPDF === true
                                                                                ? 'bg-teal-500 text-slate-900 border-2 border-teal-400'
                                                                                : 'bg-slate-800 text-slate-300 border-2 border-slate-700 hover:border-teal-500'
                                                                        }`}
                                                                    >
                                                                        Ja
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            setWantToUploadPartnerPDF(false);
                                                                            setPartnerUploadedFileName('');
                                                                            setPartnerPensionData(null);
                                                                            setPartnerAowDataFromPDF(null);
                                                                        }}
                                                                        className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                                                                            wantToUploadPartnerPDF === false
                                                                                ? 'bg-teal-500 text-slate-900 border-2 border-teal-400'
                                                                                : 'bg-slate-800 text-slate-300 border-2 border-slate-700 hover:border-teal-500'
                                                                        }`}
                                                                    >
                                                                        Nee, gebruik platform berekening
                                                                    </button>
                                                                </div>

                                                                {wantToUploadPartnerPDF === true && (
                                                                    <div className="p-4 bg-slate-700 rounded-lg border border-slate-600">
                                                                        <p className="text-sm text-slate-300 mb-3">Upload partner pensioengegevens (PDF/JSON/XML)</p>

                                                                        <div className="relative">
                                                                            <input
                                                                                type="file"
                                                                                accept=".json,.xml,.pdf"
                                                                                onChange={handlePartnerFileUpload}
                                                                                className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-500 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-500 file:text-slate-900 hover:file:bg-teal-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                                                                            />
                                                                        </div>

                                                                        {partnerUploadedFileName && (
                                                                            <div className="mt-3 p-3 bg-slate-800 rounded-lg border border-teal-500">
                                                                                <p className="text-xs text-teal-400 font-semibold mb-2">
                                                                                    ✓ Partner bestand geüpload: {partnerUploadedFileName}
                                                                                </p>

                                                                                {partnerAowDataFromPDF && (
                                                                                    <div className="mt-2 p-2 bg-slate-700 rounded">
                                                                                        <p className="text-xs text-amber-400 font-semibold">AOW Partner (bruto)</p>
                                                                                        <p className="text-sm text-slate-300">{formatCurrency(partnerAowDataFromPDF.amount)} per jaar</p>
                                                                                        <p className="text-xs text-slate-400">Vanaf AOW-leeftijd</p>
                                                                                    </div>
                                                                                )}

                                                                                {partnerPensionData && (
                                                                                    <div className="mt-2 p-2 bg-slate-700 rounded">
                                                                                        <p className="text-xs text-blue-400 font-semibold">Pensioen (bruto)</p>
                                                                                        <p className="text-xs text-slate-400">
                                                                                            {partnerPensionData.length} jaren met pensioengegevens
                                                                                        </p>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-6 flex justify-between">
                                            <button
                                                onClick={handleBack}
                                                className="px-4 py-2 text-sm text-slate-400 hover:text-white font-semibold transition-colors"
                                            >
                                                ← Terug
                                            </button>
                                            <button
                                                onClick={handleStep2Next}
                                                className="px-6 py-2 text-sm bg-teal-500 text-slate-900 font-bold rounded-lg hover:bg-teal-400 transition-colors shadow-lg"
                                            >
                                                Bekijk Dashboard →
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 3: Dashboard */}
                                {currentStep === 3 && results && (
                                    <>
                                        <div className="mb-6">
                                            <div className="flex justify-between items-center mb-3">
                                                <h2 className="text-2xl font-bold text-white">Dashboard - {name}</h2>
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={generatePDFReport}
                                                        className="px-4 py-2 text-sm bg-teal-500 text-slate-900 font-bold rounded-lg hover:bg-teal-400 transition-colors shadow-lg"
                                                    >
                                                        📄 Download Rapport
                                                    </button>
                                                    <button
                                                        onClick={handleRestart}
                                                        className="px-4 py-2 text-sm bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-600 transition-colors border border-slate-600 shadow-sm"
                                                    >
                                                        ← Opnieuw Beginnen
                                                    </button>
                                                </div>
                                            </div>
                                            {/* Reverse mode info */}
                                            {results.mode === 'reverse' && (
                                                <div className="flex flex-wrap gap-4 text-sm">
                                                    <div className="px-3 py-2 bg-slate-700 rounded-lg border border-slate-600">
                                                        <span className="text-slate-400">Leeftijd bij stoppen met werken: </span>
                                                        <span className="text-teal-400 font-semibold">{results.retirementAge} jaar</span>
                                                    </div>
                                                    <div className="px-3 py-2 bg-slate-700 rounded-lg border border-slate-600">
                                                        <span className="text-slate-400">Jaar van stoppen: </span>
                                                        <span className="text-teal-400 font-semibold">{results.retirementYear}</span>
                                                    </div>
                                                    {aowAge && aowDate && (
                                                        <div className="px-3 py-2 bg-slate-700 rounded-lg border border-slate-600">
                                                            <span className="text-slate-400">Uw AOW-leeftijd: </span>
                                                            <span className="text-teal-400 font-semibold">{formatAOWAge(aowAge)} ({formatAOWDate(aowDate)})</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {ageAtWithdrawal && enableWithdrawals && results.mode !== 'reverse' && (
                                                <div className="flex flex-wrap gap-4 text-sm">
                                                    <div className="px-3 py-2 bg-slate-700 rounded-lg border border-slate-600">
                                                        <span className="text-slate-400">Leeftijd bij aanvang uitkering: </span>
                                                        <span className="text-teal-400 font-semibold">{ageAtWithdrawal} jaar</span>
                                                    </div>
                                                    {aowAge && aowDate && (
                                                        <div className="px-3 py-2 bg-slate-700 rounded-lg border border-slate-600">
                                                            <span className="text-slate-400">Uw AOW-leeftijd: </span>
                                                            <span className="text-teal-400 font-semibold">{formatAOWAge(aowAge)} ({formatAOWDate(aowDate)})</span>
                                                        </div>
                                                    )}
                                                    {hasPartner && partnerAowAge && partnerAowDate && deductAOW && withdrawalIsCombined && (
                                                        <div className="px-3 py-2 bg-slate-700 rounded-lg border border-slate-600">
                                                            <span className="text-slate-400">Partner AOW-leeftijd: </span>
                                                            <span className="text-teal-400 font-semibold">{formatAOWAge(partnerAowAge)} ({formatAOWDate(partnerAowDate)})</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                            {/* Reverse Mode Dashboard */}
                            {results && results.mode === 'reverse' && (
                                <div id="dashboard-content" className="space-y-3">
                                    {/* Summary and Capital - Combined */}
                                    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                                        <div className="bg-gradient-to-r from-slate-700 to-slate-600 px-4 py-2.5">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-base font-bold text-white">Uw Financiële Plan</h3>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-slate-300">Benodigd in {results.retirementYear}</p>
                                                    <p className="text-lg font-bold text-white">€ {formatNumber(Math.round(results.requiredCapitalAtRetirement))}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-3">
                                            <div className="grid grid-cols-3 gap-x-3 gap-y-1.5 text-[11px] text-slate-700 mb-3">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">Pensioen:</span>
                                                    <span className="font-semibold">{results.retirementAge} jaar ({results.yearsToRetirement}j)</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">Jaarinkomen:</span>
                                                    <span className="font-semibold">€ {formatNumber(Math.round(results.targetIncome))}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">Duur:</span>
                                                    <span className="font-semibold">{results.withdrawalDuration} jaar</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">Inflatie:</span>
                                                    <span className="font-semibold">{results.applyInflation ? 'Ja (2%)' : 'Nee'}</span>
                                                </div>
                                                {reverseDeductAOWPension && (
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-500">AOW:</span>
                                                        <span className="font-semibold text-teal-600">Aftrek</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">Rendement:</span>
                                                    <span className="font-semibold">{(results.investmentReturn * 100).toFixed(1)}%</span>
                                                </div>
                                            </div>

                                            {/* Investment Options - PROMINENT */}
                                            <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg p-4 shadow-lg">
                                                <h4 className="text-base font-bold text-white mb-0.5 uppercase tracking-wide">💰 Uw Inleg Opties</h4>
                                                <p className="text-xs text-teal-50 mb-3">Kies één van de volgende opties om uw doel te bereiken</p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {/* Lump Sum Option */}
                                                    <div className="bg-white rounded-lg p-4 shadow-lg border-2 border-teal-300">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div>
                                                                <p className="text-[10px] text-teal-600 font-bold uppercase tracking-wide">Optie A</p>
                                                                <p className="text-sm font-bold text-slate-800">Eenmalige inleg</p>
                                                            </div>
                                                            <div className="w-9 h-9 bg-teal-100 rounded-full flex items-center justify-center">
                                                                <svg className="w-5 h-5 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                        <p className="text-3xl font-extrabold text-slate-900 mb-1">€ {formatNumber(Math.round(results.fullLumpSum))}</p>
                                                        <p className="text-xs font-medium text-slate-600 mb-2">Eenmalig inleggen vandaag</p>
                                                        <div className="pt-2 border-t border-slate-100">
                                                            <p className="text-[10px] text-slate-500">{results.buildUpProfile} • {(results.buildUpReturn * 100).toFixed(1)}%/jr</p>
                                                        </div>
                                                    </div>

                                                    {/* Periodic Option */}
                                                    <div className="bg-white rounded-lg p-4 shadow-lg border-2 border-teal-300">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div>
                                                                <p className="text-[10px] text-teal-600 font-bold uppercase tracking-wide">Optie B</p>
                                                                <p className="text-sm font-bold text-slate-800">Maandelijkse storting</p>
                                                            </div>
                                                            <div className="w-9 h-9 bg-teal-100 rounded-full flex items-center justify-center">
                                                                <svg className="w-5 h-5 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                        <p className="text-3xl font-extrabold text-slate-900 mb-1">€ {formatNumber(Math.round(results.fullMonthlyDeposit))}</p>
                                                        <p className="text-xs font-medium text-slate-600 mb-2">Per maand storten</p>
                                                        <div className="pt-2 border-t border-slate-100">
                                                            <p className="text-[10px] text-slate-500">{results.yearsToRetirement * 12} mnd • {results.buildUpProfile} • {(results.buildUpReturn * 100).toFixed(1)}%</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-blue-50 border-l-4 border-blue-400 p-2.5 mt-3">
                                                <p className="text-xs text-slate-700">
                                                    <strong className="font-semibold">Let op:</strong> U kunt hieronder ook een combinatie van beide opties kiezen.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Savings Plan */}
                                    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                                        <div className="bg-gradient-to-r from-slate-700 to-slate-600 px-4 py-2.5">
                                            <h3 className="text-base font-bold text-white">Combinatie Spaarplan</h3>
                                        </div>

                                        <div className="p-3">
                                            {results.currentCapital > 0 && (
                                                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 mb-3">
                                                    <h4 className="text-[10px] font-semibold text-slate-700 mb-2 uppercase tracking-wide">Huidige Situatie</h4>
                                                    <div className="grid grid-cols-3 gap-3 text-xs">
                                                        <div>
                                                            <p className="text-[10px] text-slate-500 mb-0.5">Huidig</p>
                                                            <p className="text-lg font-bold text-slate-900">€ {formatNumber(Math.round(results.currentCapital))}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-slate-500 mb-0.5">In {results.retirementYear}</p>
                                                            <p className="text-lg font-bold text-slate-900">€ {formatNumber(Math.round(results.futureValueOfCurrentCapital))}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-slate-500 mb-0.5">Nog Sparen</p>
                                                            <p className="text-lg font-bold text-teal-600">€ {formatNumber(Math.round(results.shortage))}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="mb-3">
                                                <div className="flex justify-between items-center mb-2">
                                                    <h4 className="text-xs font-semibold text-slate-700">Pas uw strategie aan</h4>
                                                    <span className="text-[10px] font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">
                                                        {results.lumpSumPercentage === 0 ? '100% Periodiek' :
                                                         results.lumpSumPercentage === 100 ? '100% Eenmalig' :
                                                         `${results.lumpSumPercentage}% Eenmalig / ${100 - results.lumpSumPercentage}% Periodiek`}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-2.5 border border-slate-200">
                                                    <span className="text-[10px] font-medium text-slate-600 whitespace-nowrap">Periodiek</span>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="100"
                                                        step="5"
                                                        value={results.lumpSumPercentage}
                                                        onChange={(e) => {
                                                            const newValue = Number(e.target.value);
                                                            setLumpSumPercentage(newValue);
                                                        }}
                                                        onMouseUp={() => calculateResults()}
                                                        onTouchEnd={() => calculateResults()}
                                                        className="flex-1 h-2.5 bg-slate-300 rounded-lg appearance-none cursor-pointer slider"
                                                        style={{
                                                            background: `linear-gradient(to right, #14b8a6 ${results.lumpSumPercentage}%, #cbd5e1 ${results.lumpSumPercentage}%)`
                                                        }}
                                                    />
                                                    <span className="text-[10px] font-medium text-slate-600 whitespace-nowrap">Eenmalig</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2 mb-3">
                                                {/* Eenmalige inleg */}
                                                {results.lumpSumPercentage > 0 && (
                                                    <div className="bg-slate-50 border border-slate-300 rounded-lg p-2.5">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <p className="text-[10px] text-slate-500 font-medium">Eenmalig</p>
                                                            <span className="text-[9px] bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded font-semibold">{results.lumpSumPercentage}%</span>
                                                        </div>
                                                        <p className="text-xl font-bold text-slate-900">€ {formatNumber(Math.round(results.requiredLumpSum))}</p>
                                                        <p className="text-[10px] text-slate-500 mt-1">{results.buildUpProfile} • {(results.buildUpReturn * 100).toFixed(1)}%</p>
                                                    </div>
                                                )}

                                                {/* Maandelijkse storting */}
                                                {results.lumpSumPercentage < 100 && (
                                                    <div className="bg-slate-50 border border-slate-300 rounded-lg p-2.5">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <p className="text-[10px] text-slate-500 font-medium">Maandelijks</p>
                                                            {results.lumpSumPercentage > 0 && (
                                                                <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-semibold">{100 - results.lumpSumPercentage}%</span>
                                                            )}
                                                        </div>
                                                        <p className="text-xl font-bold text-slate-900">€ {formatNumber(Math.round(results.requiredMonthlyDeposit))}</p>
                                                        <p className="text-[10px] text-slate-500 mt-1">{results.yearsToRetirement * 12} mnd</p>
                                                    </div>
                                                )}

                                                {/* Jaarlijkse storting */}
                                                {results.lumpSumPercentage < 100 && (
                                                    <div className="bg-slate-50 border border-slate-300 rounded-lg p-2.5">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <p className="text-[10px] text-slate-500 font-medium">Jaarlijks</p>
                                                            {results.lumpSumPercentage > 0 && (
                                                                <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-semibold">{100 - results.lumpSumPercentage}%</span>
                                                            )}
                                                        </div>
                                                        <p className="text-xl font-bold text-slate-900">€ {formatNumber(Math.round(results.requiredAnnualDeposit))}</p>
                                                        <p className="text-[10px] text-slate-500 mt-1">{results.yearsToRetirement} jr</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Quick reference for full amounts */}
                                            <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200">
                                                <p className="text-[10px] font-semibold text-slate-700 mb-2 uppercase tracking-wide">Referentie - 100%</p>
                                                <div className="grid grid-cols-3 gap-3 text-[10px]">
                                                    <div>
                                                        <span className="text-slate-500 block mb-0.5">Eenmalig</span>
                                                        <span className="text-slate-900 font-bold text-xs">€ {formatNumber(Math.round(results.fullLumpSum))}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-500 block mb-0.5">Maandelijks</span>
                                                        <span className="text-slate-900 font-bold text-xs">€ {formatNumber(Math.round(results.fullMonthlyDeposit))}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-500 block mb-0.5">Jaarlijks</span>
                                                        <span className="text-slate-900 font-bold text-xs">€ {formatNumber(Math.round(results.fullAnnualDeposit))}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Year-by-Year Planning Table */}
                                    {results.yearByYear.length > 0 && (
                                        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                                            <div className="bg-gradient-to-r from-slate-700 to-slate-600 px-4 py-2">
                                                <h2 className="text-sm font-bold text-white mb-2">Jaarlijkse Planning & Onttrekkingen</h2>
                                            </div>
                                            <div className="overflow-auto max-h-[500px]">
                                                <table className="w-full text-xs">
                                                    <thead className="sticky top-0 z-10">
                                                        <tr className="bg-gradient-to-r from-slate-700 to-slate-600">
                                                            <th className="text-left py-1 px-3">
                                                                <p className="text-[9px] text-slate-400">Periode</p>
                                                                <p className="text-xs font-bold text-white">{results.withdrawalDuration} jaar</p>
                                                            </th>
                                                            {reverseDeductAOWPension && (
                                                                <>
                                                                    <th className="text-right py-1 px-3">
                                                                        <p className="text-[9px] text-slate-300">Totaal AOW</p>
                                                                        <p className="text-xs font-bold text-teal-300">€ {formatNumber(Math.round(results.totalAowDeduction || 0))}</p>
                                                                    </th>
                                                                    <th className="text-right py-1 px-3">
                                                                        <p className="text-[9px] text-slate-300">Totaal Pensioen</p>
                                                                        <p className="text-xs font-bold text-blue-300">€ {formatNumber(Math.round(results.totalPensionIncome || 0))}</p>
                                                                    </th>
                                                                </>
                                                            )}
                                                            <th className="text-right py-1 px-3">
                                                                <p className="text-[9px] text-slate-300">Totaal Onttrokken</p>
                                                                <p className="text-xs font-bold text-white">€ {formatNumber(Math.round(results.totalRequiredWithdrawal))}</p>
                                                            </th>
                                                            <th className="text-right py-1 px-3">
                                                                <p className="text-[9px] text-slate-300">Totaal Gereserveerd</p>
                                                                <p className="text-xs font-bold text-purple-300">€ {formatNumber(Math.round(results.requiredCapitalAtRetirement))}</p>
                                                            </th>
                                                        </tr>
                                                        <tr className="bg-slate-50">
                                                            <th className="text-left py-2 px-3 font-semibold text-slate-700">Jaar</th>
                                                            {reverseDeductAOWPension && (
                                                                <>
                                                                    <th className="text-right py-2 px-3 font-semibold text-slate-700">AOW</th>
                                                                    <th className="text-right py-2 px-3 font-semibold text-slate-700">Pensioen</th>
                                                                </>
                                                            )}
                                                            <th className="text-right py-2 px-3 font-semibold text-teal-700">Onttrekking</th>
                                                            <th className="text-right py-2 px-3 font-semibold text-purple-700">Gereserveerd (PV)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {results.yearByYear.map((row, idx) => (
                                                            <tr key={idx} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                                                <td className="py-2 px-3 text-slate-900 font-medium">{row.year}</td>
                                                                {reverseDeductAOWPension && (
                                                                    <>
                                                                        <td className="text-right py-2 px-3 text-teal-600">
                                                                            {row.aowDeduction > 0 ? `€ ${formatNumber(Math.round(row.aowDeduction))}` : '-'}
                                                                        </td>
                                                                        <td className="text-right py-2 px-3 text-blue-600">
                                                                            {row.pensionIncome > 0 ? `€ ${formatNumber(Math.round(row.pensionIncome))}` : '-'}
                                                                        </td>
                                                                    </>
                                                                )}
                                                                <td className="text-right py-2 px-3 text-slate-900 font-semibold">€ {formatNumber(Math.round(row.netWithdrawal))}</td>
                                                                <td className="text-right py-2 px-3 text-purple-700 font-semibold">€ {formatNumber(Math.round(row.presentValue))}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Modern Dashboard Design */}
                            {results && enableWithdrawals && results.mode !== 'reverse' && (
                                <div id="dashboard-content" className="space-y-4">

                                    {/* Planning Table */}
                                    {results.yearByYear.length > 0 && (
                                        <div className="bg-slate-800 rounded-xl shadow-xl overflow-hidden border border-slate-700">
                                            <div className="bg-gradient-to-r from-slate-700 to-slate-600 px-4 py-3">
                                                <h2 className="text-lg font-bold text-white">Jaarlijkse Planning</h2>
                                            </div>
                                            <div className="overflow-auto p-4 max-h-[600px]">
                                                <table className="w-full text-xs min-w-max">
                                                    <thead>
                                                        <tr className="border-b-2 border-slate-600">
                                                            <th className="text-left py-2 px-3 font-bold text-slate-400 min-w-[200px]"></th>
                                                            {results.yearByYear.map((row, idx) => {
                                                                // Check if this is first year of user AOW
                                                                const isFirstUserAOW = row.userAowActive && (idx === 0 || !results.yearByYear[idx - 1].userAowActive);
                                                                // Check if this is first year of partner AOW
                                                                const isFirstPartnerAOW = row.partnerAowActive && (idx === 0 || !results.yearByYear[idx - 1].partnerAowActive);

                                                                return (
                                                                    <th key={idx} className={`text-center py-2 px-2 font-bold ${isFirstUserAOW || isFirstPartnerAOW ? 'bg-amber-500 text-slate-900' : 'text-white'}`}>
                                                                        {row.year}
                                                                        {(isFirstUserAOW || isFirstPartnerAOW) && (
                                                                            <div className="text-[9px] font-normal mt-0.5">
                                                                                {isFirstUserAOW && (
                                                                                    <div>
                                                                                        AOW Start
                                                                                        {row.userAowFraction < 1 && (
                                                                                            <div className="text-[8px]">({Math.round(row.userAowFraction * 12)}/12 mnd)</div>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                                {isFirstPartnerAOW && (
                                                                                    <div>
                                                                                        {isFirstUserAOW && '+ '}Partner
                                                                                        {row.partnerAowFraction < 1 && (
                                                                                            <div className="text-[8px]">({Math.round(row.partnerAowFraction * 12)}/12 mnd)</div>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </th>
                                                                );
                                                            })}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr className="border-b border-slate-700">
                                                            <td className="py-2 px-3 font-semibold text-slate-400 whitespace-nowrap">Periode</td>
                                                            {results.yearByYear.map((row, idx) => (
                                                                <td key={idx} className="text-center py-2 px-2 text-slate-300">{row.period}</td>
                                                            ))}
                                                        </tr>
                                                        <tr className="border-b border-slate-700 bg-slate-900">
                                                            <td className="py-2 px-3 font-semibold text-slate-400 whitespace-nowrap">
                                                                Gewenste opname{inflationCorrection > 0 && <span className="text-xs"> (infl. {formatPercent(inflationCorrection)})</span>}
                                                            </td>
                                                            {results.yearByYear.map((row, idx) => (
                                                                <td key={idx} className="text-center py-2 px-2 text-slate-300">{formatCurrency(row.inflatedWithdrawal)}</td>
                                                            ))}
                                                        </tr>
                                                        {/* AOW from PDF - shown if PDF data is enabled and available */}
                                                        {results.usePDFData && results.hasAowDataFromPDF && (
                                                            <tr className="border-b border-slate-700 cursor-pointer hover:bg-slate-750 transition-colors" onClick={showAOWDetails}>
                                                                <td className="py-2 px-3 font-semibold text-amber-400 whitespace-nowrap flex items-center gap-2">
                                                                    <span>
                                                                        AOW {results.hasPartner && results.withdrawalIsCombined ? '(uw PDF + partner handmatig)' : '(bruto uit PDF)'}
                                                                    </span>
                                                                    <span className="text-xs text-slate-400">ℹ️</span>
                                                                </td>
                                                                {results.yearByYear.map((row, idx) => (
                                                                    <td
                                                                        key={idx}
                                                                        className="text-center py-2 px-2 text-amber-400 cursor-pointer hover:bg-slate-750 transition-colors"
                                                                        onClick={() => showAOWYearDetails(row)}
                                                                    >
                                                                        {row.aowDeduction > 0 ? (
                                                                            <span>-{formatCurrency(row.aowDeduction)}</span>
                                                                        ) : '-'}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        )}

                                                        {/* Manual AOW - shown if PDF data is NOT enabled and deductAOW is enabled */}
                                                        {!results.usePDFData && results.deductAOW && (
                                                            <tr className="border-b border-slate-700">
                                                                <td className="py-2 px-3 font-semibold text-slate-400 whitespace-nowrap cursor-pointer hover:bg-slate-750 transition-colors" onClick={showAOWDetails}>
                                                                    <div className="flex items-center gap-2">
                                                                        <span>AOW aftrek{results.hasPartner && results.withdrawalIsCombined && <span className="text-xs"> (beiden)</span>}</span>
                                                                        <span className="text-xs text-slate-400">ℹ️</span>
                                                                    </div>
                                                                    <div className="text-[9px] text-slate-500 mt-0.5 whitespace-normal">Klik op jaar voor details</div>
                                                                </td>
                                                                {results.yearByYear.map((row, idx) => (
                                                                    <td
                                                                        key={idx}
                                                                        className="text-center py-2 px-2 text-slate-300 cursor-pointer hover:bg-slate-750 transition-colors"
                                                                        onClick={() => showAOWYearDetails(row)}
                                                                    >
                                                                        {row.aowDeduction > 0 ? (
                                                                            <span>-{formatCurrency(row.aowDeduction)}</span>
                                                                        ) : '-'}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        )}

                                                        {/* Pension from PDF - shown if PDF data is enabled and available */}
                                                        {results.usePDFData && results.hasPensionData && (
                                                            <tr className="border-b border-slate-700 cursor-pointer hover:bg-slate-750 transition-colors" onClick={showPensionDetails}>
                                                                <td className="py-2 px-3 font-semibold text-blue-400 whitespace-nowrap flex items-center gap-2">
                                                                    <span>Pensioen (bruto uit PDF)</span>
                                                                    <span className="text-xs text-slate-400">ℹ️</span>
                                                                </td>
                                                                {results.yearByYear.map((row, idx) => (
                                                                    <td key={idx} className="text-center py-2 px-2 text-blue-400">
                                                                        {row.pensionIncome > 0 ? (
                                                                            <span>-{formatCurrency(row.pensionIncome)}</span>
                                                                        ) : '-'}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        )}
                                                        {((results.usePDFData && (results.hasAowDataFromPDF || results.hasPensionData)) || (!results.usePDFData && results.deductAOW)) && (
                                                            <tr className="border-b border-slate-700 bg-slate-800">
                                                                <td className="py-2 px-3 font-bold text-orange-400 whitespace-nowrap">Netto uit belegging</td>
                                                                {results.yearByYear.map((row, idx) => (
                                                                    <td key={idx} className="text-center py-2 px-2 font-semibold text-orange-400">{formatCurrency(row.netWithdrawal)}</td>
                                                                ))}
                                                            </tr>
                                                        )}
                                                        <tr className="bg-slate-900 border-b-2 border-teal-500 cursor-pointer hover:bg-slate-800 transition-colors" onClick={showPresentValueDetails}>
                                                            <td className="py-2 px-3 font-bold text-teal-400 whitespace-nowrap">
                                                                Contante waarde <span className="text-xs font-normal text-slate-400">({results.savingsPeriod}j@1,5% + {results.discountProfile} {formatPercent(results.discountRate)})</span>
                                                                <span className="ml-2 text-xs">🔍</span>
                                                            </td>
                                                            {results.yearByYear.map((row, idx) => (
                                                                <td key={idx} className="text-center py-2 px-2 font-semibold text-teal-400">{formatCurrency(row.presentValue)}</td>
                                                            ))}
                                                        </tr>
                                                    </tbody>
                                                </table>
                                                <div className="sticky bottom-0 left-0 right-0 bg-slate-800 border-t-2 border-teal-500 pt-3 mt-4">
                                                    <button onClick={showWithdrawalsBreakdown} className="w-full flex items-center justify-end gap-2 cursor-pointer hover:opacity-90 transition-opacity">
                                                        <div className="text-xs font-medium text-slate-400">TOTAAL ONTTREKKINGEN:</div>
                                                        <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-slate-900 px-4 py-2 rounded-lg font-bold text-base shadow-lg">
                                                            {formatCurrency(results.totalPresentValue)}
                                                        </div>
                                                        <span className="text-slate-400 text-sm ml-1">🔍</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Vermogensontwikkeling - Horizontal Flow Design */}
                                    <div className="bg-slate-800 rounded-xl shadow-xl overflow-hidden border border-slate-700">
                                        <div className="bg-gradient-to-r from-slate-700 to-slate-600 px-4 py-3">
                                            <h2 className="text-lg font-bold text-white">Vermogensontwikkeling</h2>
                                        </div>
                                        <div className="p-8">
                                            {/* Horizontal Flow Diagram */}
                                            <div className="flex items-center justify-between px-4 py-6">
                                                {/* Start Amount */}
                                                <div className="text-center">
                                                    <div className="bg-slate-800 rounded-lg px-4 py-3 border border-slate-600 shadow-lg">
                                                        <div className="text-xs text-slate-400 mb-1">Start</div>
                                                        <div className="text-lg font-bold text-white">{new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(lumpSum)}</div>
                                                    </div>
                                                </div>

                                                {/* Arrow 1 */}
                                                <div className="flex-1 mx-4 min-w-[250px]">
                                                    <div className="bg-gradient-to-r from-slate-700 to-slate-600 px-6 py-4 border border-slate-600 shadow-lg" style={{clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 50%, calc(100% - 20px) 100%, 0 100%)'}}>
                                                        <div className="text-xs text-slate-200 font-semibold text-center">
                                                            Doelrendement: {formatPercent(results.buildUpReturn)}
                                                        </div>
                                                        <div className="text-xs text-slate-400 text-center">
                                                            {period} Jaar
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Future Value */}
                                                <div className="text-center">
                                                    <div className="bg-slate-800 rounded-lg px-4 py-3 border border-slate-600 shadow-lg">
                                                        <div className="text-xs text-slate-400 mb-1">Na opbouw</div>
                                                        <div className="text-lg font-bold text-white">{new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(results.futureValue)}</div>
                                                    </div>
                                                </div>

                                                {/* Split Arrows */}
                                                <div className="flex flex-col items-start justify-center ml-6 gap-8">
                                                    {/* Upper arrow - Withdrawals */}
                                                    <div className="flex items-center gap-2">
                                                        <div className="bg-gradient-to-r from-slate-700 to-slate-600 px-4 py-2 border border-slate-600 shadow-md w-[100px]" style={{clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%)'}}>
                                                            <div className="text-xs text-slate-200 font-semibold text-center">Opnames</div>
                                                        </div>
                                                        <div className="bg-slate-800 rounded-lg px-3 py-2 border border-slate-600 shadow-lg">
                                                            <div className="text-sm font-bold text-white">{new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(results.totalPresentValue)}</div>
                                                        </div>
                                                    </div>

                                                    {/* Lower arrow - Remaining */}
                                                    <div className="flex items-center gap-2">
                                                        <div className="bg-gradient-to-r from-slate-700 to-slate-600 px-4 py-2 border border-slate-600 shadow-md w-[100px]" style={{clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%)'}}>
                                                            <div className="text-xs text-slate-200 font-semibold text-center">Restant</div>
                                                        </div>
                                                        <div className="bg-slate-800 rounded-lg px-3 py-2 border border-slate-600 shadow-lg">
                                                            <div className="text-sm font-bold text-white">{new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(results.remainingAfterWithdrawals)}</div>
                                                        </div>

                                                        {/* Arrow 2 - inline with lower path */}
                                                        <div className="flex-1 mx-4 min-w-[250px]">
                                                            <div className="bg-gradient-to-r from-slate-700 to-slate-600 px-6 py-4 border border-slate-600 shadow-lg" style={{clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 50%, calc(100% - 20px) 100%, 0 100%)'}}>
                                                                <div className="text-xs text-slate-200 font-semibold text-center">
                                                                    Doelrendement {formatPercent(results.withdrawalReturn)}
                                                                </div>
                                                                <div className="text-xs text-slate-400 text-center">
                                                                    {results.withdrawalPeriod} Jaar
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Final Value - inline with lower path */}
                                                        <div className="text-center">
                                                            <div className="bg-slate-800 rounded-lg px-4 py-3 border border-slate-600 shadow-lg">
                                                                <div className="text-xs text-slate-400 mb-1">Eindwaarde</div>
                                                                <div className="text-lg font-bold text-white">{new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(results.finalValue)}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="text-center mt-4 text-slate-500 text-xs">
                            <p>Vermogensbehoud Calculator - Gebaseerd op financiële modelleringstechnieken</p>
                        </div>
                    </div>

                    {/* Modal for AOW/Pension Details */}
                    {showModal && modalContent && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
                            <div className="bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full mx-4 border border-slate-700" onClick={(e) => e.stopPropagation()}>
                                <div className="bg-gradient-to-r from-slate-700 to-slate-600 px-6 py-4 flex justify-between items-center">
                                    <h2 className="text-xl font-bold text-white">
                                        {modalContent.type === 'aow' ? 'AOW Details' : 'Pensioen Details'}
                                    </h2>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="text-slate-300 hover:text-white text-2xl font-bold leading-none"
                                    >
                                        ×
                                    </button>
                                </div>

                                <div className="p-6 max-h-[70vh] overflow-y-auto">
                                    {modalContent.type === 'aow' && (
                                        <div className="space-y-4">
                                            {modalContent.usePDF && modalContent.pdfData ? (
                                                // PDF Data for User + Manual for Partner
                                                <>
                                                    {/* User AOW from PDF */}
                                                    <div className="bg-slate-700 p-4 rounded-lg">
                                                        <h3 className="text-amber-400 font-semibold mb-3">Uw AOW (uit PDF)</h3>
                                                        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                                                            <div>
                                                                <p className="text-slate-400">Organisatie</p>
                                                                <p className="text-white font-semibold">{modalContent.pdfData.organisatie}</p>
                                                            </div>
                                                            {modalContent.pdfData.standPer && (
                                                                <div>
                                                                    <p className="text-slate-400">Stand per</p>
                                                                    <p className="text-white font-semibold">{modalContent.pdfData.standPer}</p>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="space-y-2 text-sm">
                                                            <div className="flex justify-between">
                                                                <span className="text-slate-300">AOW leeftijd</span>
                                                                <span className="text-white font-semibold">
                                                                    {modalContent.manualData.userAge ? formatAOWAge(modalContent.manualData.userAge) : 'Niet ingesteld'}
                                                                </span>
                                                            </div>
                                                            {modalContent.manualData.userDate && (
                                                                <div className="flex justify-between">
                                                                    <span className="text-slate-300">AOW ingangsdatum</span>
                                                                    <span className="text-white font-semibold">{formatAOWDate(modalContent.manualData.userDate)}</span>
                                                                </div>
                                                            )}
                                                            <div className="flex justify-between items-center pt-2 border-t border-slate-600">
                                                                <span className="text-slate-300">Te bereiken AOW</span>
                                                                <span className="text-white font-bold text-lg">{formatCurrency(modalContent.pdfData.teBereiken)}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-slate-300">Al opgebouwd</span>
                                                                <span className="text-teal-400 font-semibold">{formatCurrency(modalContent.pdfData.opgebouwd)}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Partner AOW - from PDF or Manual */}
                                                    {modalContent.manualData.hasPartner && modalContent.manualData.withdrawalIsCombined && (
                                                        <>
                                                            {modalContent.usePartnerPDF && modalContent.partnerPdfData ? (
                                                                <div className="bg-slate-700 p-4 rounded-lg border-2 border-blue-500">
                                                                    <h3 className="text-blue-400 font-semibold mb-3">Partner AOW (uit PDF)</h3>
                                                                    <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                                                                        <div>
                                                                            <p className="text-slate-400">Organisatie</p>
                                                                            <p className="text-white font-semibold">{modalContent.partnerPdfData.organisatie}</p>
                                                                        </div>
                                                                        {modalContent.partnerPdfData.standPer && (
                                                                            <div>
                                                                                <p className="text-slate-400">Stand per</p>
                                                                                <p className="text-white font-semibold">{modalContent.partnerPdfData.standPer}</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="space-y-2 text-sm">
                                                                        <div className="flex justify-between">
                                                                            <span className="text-slate-300">AOW leeftijd</span>
                                                                            <span className="text-white font-semibold">
                                                                                {modalContent.manualData.partnerAge ? formatAOWAge(modalContent.manualData.partnerAge) : 'Niet ingesteld'}
                                                                            </span>
                                                                        </div>
                                                                        {modalContent.manualData.partnerDate && (
                                                                            <div className="flex justify-between">
                                                                                <span className="text-slate-300">AOW ingangsdatum</span>
                                                                                <span className="text-white font-semibold">{formatAOWDate(modalContent.manualData.partnerDate)}</span>
                                                                            </div>
                                                                        )}
                                                                        <div className="flex justify-between items-center pt-2 border-t border-slate-600">
                                                                            <span className="text-slate-300">Te bereiken AOW</span>
                                                                            <span className="text-white font-bold text-lg">{formatCurrency(modalContent.partnerPdfData.teBereiken)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between items-center">
                                                                            <span className="text-slate-300">Al opgebouwd</span>
                                                                            <span className="text-teal-400 font-semibold">{formatCurrency(modalContent.partnerPdfData.opgebouwd)}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="bg-slate-700 p-4 rounded-lg border-2 border-blue-500">
                                                                    <h3 className="text-blue-400 font-semibold mb-3">Partner AOW (handmatige berekening)</h3>
                                                                    <p className="text-xs text-slate-400 mb-3">Geen PDF geüpload voor partner, gebruikt handmatige instellingen</p>
                                                                    <div className="space-y-2 text-sm">
                                                                        <div className="flex justify-between">
                                                                            <span className="text-slate-300">AOW leeftijd</span>
                                                                            <span className="text-white font-semibold">
                                                                                {modalContent.manualData.partnerAge ? formatAOWAge(modalContent.manualData.partnerAge) : 'Niet ingesteld'}
                                                                            </span>
                                                                        </div>
                                                                        {modalContent.manualData.partnerDate && (
                                                                            <div className="flex justify-between">
                                                                                <span className="text-slate-300">AOW ingangsdatum</span>
                                                                                <span className="text-white font-semibold">{formatAOWDate(modalContent.manualData.partnerDate)}</span>
                                                                            </div>
                                                                        )}
                                                                        <div className="flex justify-between items-center pt-2 border-t border-slate-600">
                                                                            <span className="text-slate-300">Bedrag (bruto per jaar)</span>
                                                                            <span className="text-white font-bold text-lg">{formatCurrency(modalContent.manualData.partnerAmount)}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}

                                                    {/* Combined Total */}
                                                    {modalContent.manualData.hasPartner && modalContent.manualData.withdrawalIsCombined && (
                                                        <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4 rounded-lg">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-slate-900 font-semibold">Totaal gecombineerd AOW</span>
                                                                <span className="text-slate-900 font-bold text-2xl">
                                                                    {formatCurrency(modalContent.pdfData.teBereiken + (modalContent.usePartnerPDF && modalContent.partnerPdfData ? modalContent.partnerPdfData.teBereiken : modalContent.manualData.partnerAmount))}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                // Manual Data
                                                <>
                                                    <div className="bg-slate-700 p-4 rounded-lg">
                                                        <h3 className="text-amber-400 font-semibold mb-3">AOW Berekening (handmatig)</h3>
                                                        <p className="text-xs text-slate-400 mb-3">Bedragen zoals ingesteld in stap 3</p>

                                                        {/* User AOW */}
                                                        <div className="mb-4 pb-4 border-b border-slate-600">
                                                            <h4 className="text-sm font-semibold text-white mb-3">Uw AOW</h4>
                                                            <div className="space-y-2 text-sm">
                                                                <div className="flex justify-between">
                                                                    <span className="text-slate-300">AOW leeftijd</span>
                                                                    <span className="text-white font-semibold">
                                                                        {modalContent.manualData.userAge ? formatAOWAge(modalContent.manualData.userAge) : 'Niet ingesteld'}
                                                                    </span>
                                                                </div>
                                                                {modalContent.manualData.userDate && (
                                                                    <div className="flex justify-between">
                                                                        <span className="text-slate-300">AOW ingangsdatum</span>
                                                                        <span className="text-white font-semibold">{formatAOWDate(modalContent.manualData.userDate)}</span>
                                                                    </div>
                                                                )}
                                                                <div className="flex justify-between items-center pt-2 border-t border-slate-600">
                                                                    <span className="text-slate-300">Bedrag (bruto per jaar)</span>
                                                                    <span className="text-white font-bold text-lg">{formatCurrency(modalContent.manualData.userAmount)}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Partner AOW */}
                                                        {modalContent.manualData.hasPartner && modalContent.manualData.withdrawalIsCombined && (
                                                            <div>
                                                                <h4 className="text-sm font-semibold text-white mb-3">Partner AOW</h4>
                                                                <div className="space-y-2 text-sm">
                                                                    <div className="flex justify-between">
                                                                        <span className="text-slate-300">AOW leeftijd</span>
                                                                        <span className="text-white font-semibold">
                                                                            {modalContent.manualData.partnerAge ? formatAOWAge(modalContent.manualData.partnerAge) : 'Niet ingesteld'}
                                                                        </span>
                                                                    </div>
                                                                    {modalContent.manualData.partnerDate && (
                                                                        <div className="flex justify-between">
                                                                            <span className="text-slate-300">AOW ingangsdatum</span>
                                                                            <span className="text-white font-semibold">{formatAOWDate(modalContent.manualData.partnerDate)}</span>
                                                                        </div>
                                                                    )}
                                                                    <div className="flex justify-between items-center pt-2 border-t border-slate-600">
                                                                        <span className="text-slate-300">Bedrag (bruto per jaar)</span>
                                                                        <span className="text-white font-bold text-lg">{formatCurrency(modalContent.manualData.partnerAmount)}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Combined Total */}
                                                        {modalContent.manualData.hasPartner && modalContent.manualData.withdrawalIsCombined && (
                                                            <div className="mt-4 pt-4 border-t-2 border-amber-500">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-amber-400 font-semibold">Totaal gecombineerd AOW</span>
                                                                    <span className="text-amber-400 font-bold text-xl">
                                                                        {formatCurrency(modalContent.manualData.userAmount + modalContent.manualData.partnerAmount)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            )}

                                            <div className="bg-blue-900 bg-opacity-30 p-4 rounded-lg border border-blue-700">
                                                <p className="text-xs text-blue-200">
                                                    <strong>Let op:</strong> Dit zijn indicatieve bedragen. De daadwerkelijke AOW uitkering kan afwijken afhankelijk van uw woonsituatie, opbouwjaren in Nederland, en toekomstige wetswijzigingen.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {modalContent.type === 'pension' && (
                                        <div className="space-y-4">
                                            <div className="bg-slate-700 p-4 rounded-lg">
                                                <h3 className="text-blue-400 font-semibold mb-3">Pensioen Overzicht</h3>
                                                <div className="grid grid-cols-2 gap-3 text-sm">
                                                    <div>
                                                        <p className="text-slate-400">Uitvoerder</p>
                                                        <p className="text-white font-semibold">{modalContent.data.uitvoerder}</p>
                                                    </div>
                                                    {modalContent.data.herkenningsnummer && (
                                                        <div>
                                                            <p className="text-slate-400">Herkenningsnummer</p>
                                                            <p className="text-white font-semibold text-xs">{modalContent.data.herkenningsnummer}</p>
                                                        </div>
                                                    )}
                                                    {modalContent.data.standPer && (
                                                        <div>
                                                            <p className="text-slate-400">Stand per</p>
                                                            <p className="text-white font-semibold">{modalContent.data.standPer}</p>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-slate-400">Pensioen vanaf</p>
                                                        <p className="text-white font-semibold">{modalContent.data.startAge} jaar</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-slate-700 p-4 rounded-lg">
                                                <h3 className="text-blue-400 font-semibold mb-3">Bedragen (bruto per jaar)</h3>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center border-b border-slate-600 pb-2">
                                                        <span className="text-slate-300">Te bereiken pensioen</span>
                                                        <span className="text-white font-bold text-lg">{formatCurrency(modalContent.data.teBereiken)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-slate-300">Al opgebouwd</span>
                                                        <span className="text-teal-400 font-semibold">{formatCurrency(modalContent.data.opgebouwd)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-blue-900 bg-opacity-30 p-4 rounded-lg border border-blue-700">
                                                <p className="text-xs text-blue-200">
                                                    <strong>Let op:</strong> Dit zijn indicatieve bedragen. De daadwerkelijke pensioenuitkering kan afwijken afhankelijk van toekomstige premiebetalingen, beleggingsresultaten, en uw keuzes bij pensionering.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {modalContent.type === 'aow-year' && (
                                        <div className="space-y-4">
                                            {/* Year Header */}
                                            <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4 rounded-lg">
                                                <h3 className="text-slate-900 font-bold text-xl">Jaar {modalContent.yearData.year}</h3>
                                                <p className="text-slate-800 text-sm mt-1">AOW Specificatie voor dit jaar</p>
                                            </div>

                                            {/* User AOW */}
                                            {modalContent.usePDF && modalContent.pdfData ? (
                                                <div className="bg-slate-700 p-4 rounded-lg border-2 border-amber-500">
                                                    <h4 className="text-amber-400 font-semibold mb-3">Uw AOW (uit PDF)</h4>
                                                    <div className="space-y-2 text-sm">
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-300">Jaarbedrag (bruto)</span>
                                                            <span className="text-white font-bold">{formatCurrency(modalContent.pdfData.amount)}</span>
                                                        </div>
                                                        {modalContent.yearData.userAowFraction < 1 ? (
                                                            <>
                                                                <div className="flex justify-between items-center pt-2 border-t border-slate-600">
                                                                    <span className="text-slate-300">Fractie dit jaar</span>
                                                                    <span className="text-amber-400 font-semibold">{(modalContent.yearData.userAowFraction * 100).toFixed(1)}%</span>
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-slate-300">Bedrag dit jaar</span>
                                                                    <span className="text-white font-bold text-lg">{formatCurrency(modalContent.yearData.aowFromPDF)}</span>
                                                                </div>
                                                                <div className="mt-3 p-3 bg-blue-900 bg-opacity-30 rounded border border-blue-700">
                                                                    <p className="text-xs text-blue-200 leading-relaxed">
                                                                        ℹ️ <strong>Waarom is dit bedrag lager?</strong>
                                                                        <br/><br/>
                                                                        In {modalContent.yearData.year} ontvangt u een lager bedrag dan de volledige AOW omdat de uitkering begint op {formatAOWDate(modalContent.manualData.userDate)} en dus niet een volledig jaar betreft.
                                                                        <br/><br/>
                                                                        U ontvangt {(modalContent.yearData.userAowFraction * 12).toFixed(1)} van de 12 maanden ({(modalContent.yearData.userAowFraction * 100).toFixed(1)}%).
                                                                        Het volledige jaarbedrag van {formatCurrency(modalContent.pdfData.amount)} wordt daarom vermenigvuldigd met {(modalContent.yearData.userAowFraction * 100).toFixed(1)}%,
                                                                        wat neerkomt op {formatCurrency(modalContent.yearData.aowFromPDF)}.
                                                                    </p>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="flex justify-between items-center pt-2 border-t border-slate-600">
                                                                    <span className="text-slate-300">Bedrag dit jaar</span>
                                                                    <span className="text-white font-bold text-lg">{formatCurrency(modalContent.yearData.aowFromPDF)}</span>
                                                                </div>
                                                                <div className="mt-3 p-3 bg-green-900 bg-opacity-30 rounded border border-green-700">
                                                                    <p className="text-xs text-green-200 leading-relaxed">
                                                                        ✓ <strong>Volledig jaar:</strong> In {modalContent.yearData.year} ontvangt u het volledige jaarbedrag van {formatCurrency(modalContent.pdfData.amount)} omdat u het hele jaar AOW ontvangt.
                                                                    </p>
                                                                </div>
                                                                {modalContent.inflationCorrection > 0 && (
                                                                    <div className="mt-3 p-3 bg-purple-900 bg-opacity-30 rounded border border-purple-700">
                                                                        <p className="text-xs text-purple-200 leading-relaxed">
                                                                            📈 <strong>Inflatiecorrectie:</strong> Het bovenstaande bedrag is gecorrigeerd met {formatPercent(modalContent.inflationCorrection)} inflatie per jaar.
                                                                            <br/><br/>
                                                                            Het oorspronkelijke jaarbedrag van {formatCurrency(modalContent.pdfData.amount)} is vermenigvuldigd met een groeifactor van {Math.pow(1 + modalContent.inflationCorrection, modalContent.yearData.year - modalContent.startYear).toFixed(4)} (={formatPercent(modalContent.inflationCorrection)} over {modalContent.yearData.year - modalContent.startYear} {modalContent.yearData.year - modalContent.startYear === 1 ? 'jaar' : 'jaren'}).
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : modalContent.yearData.userAowActive && (
                                                <div className="bg-slate-700 p-4 rounded-lg border-2 border-amber-500">
                                                    <h4 className="text-amber-400 font-semibold mb-3">Uw AOW (handmatige berekening)</h4>
                                                    <div className="space-y-2 text-sm">
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-300">Jaarbedrag (bruto)</span>
                                                            <span className="text-white font-bold">{formatCurrency(modalContent.manualData.userAmount)}</span>
                                                        </div>
                                                        {modalContent.yearData.userAowFraction < 1 ? (
                                                            <>
                                                                <div className="flex justify-between items-center pt-2 border-t border-slate-600">
                                                                    <span className="text-slate-300">Fractie dit jaar</span>
                                                                    <span className="text-amber-400 font-semibold">{(modalContent.yearData.userAowFraction * 100).toFixed(1)}%</span>
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-slate-300">Bedrag dit jaar</span>
                                                                    <span className="text-white font-bold text-lg">{formatCurrency(modalContent.yearData.aowDeduction - (modalContent.yearData.partnerAowFromManual || 0))}</span>
                                                                </div>
                                                                <div className="mt-3 p-3 bg-blue-900 bg-opacity-30 rounded border border-blue-700">
                                                                    <p className="text-xs text-blue-200 leading-relaxed">
                                                                        ℹ️ <strong>Waarom is dit bedrag lager?</strong>
                                                                        <br/><br/>
                                                                        In {modalContent.yearData.year} ontvangt u een lager bedrag dan de volledige AOW omdat de uitkering begint op {formatAOWDate(modalContent.manualData.userDate)} en dus niet een volledig jaar betreft.
                                                                        <br/><br/>
                                                                        U ontvangt {(modalContent.yearData.userAowFraction * 12).toFixed(1)} van de 12 maanden ({(modalContent.yearData.userAowFraction * 100).toFixed(1)}%).
                                                                        Het volledige jaarbedrag van {formatCurrency(modalContent.manualData.userAmount)} wordt daarom vermenigvuldigd met {(modalContent.yearData.userAowFraction * 100).toFixed(1)}%,
                                                                        wat neerkomt op {formatCurrency(modalContent.yearData.aowDeduction - (modalContent.yearData.partnerAowFromManual || 0))}.
                                                                    </p>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="flex justify-between items-center pt-2 border-t border-slate-600">
                                                                    <span className="text-slate-300">Bedrag dit jaar</span>
                                                                    <span className="text-white font-bold text-lg">{formatCurrency(modalContent.yearData.aowDeduction - (modalContent.yearData.partnerAowFromManual || 0))}</span>
                                                                </div>
                                                                <div className="mt-3 p-3 bg-green-900 bg-opacity-30 rounded border border-green-700">
                                                                    <p className="text-xs text-green-200 leading-relaxed">
                                                                        ✓ <strong>Volledig jaar:</strong> In {modalContent.yearData.year} ontvangt u het volledige jaarbedrag van {formatCurrency(modalContent.manualData.userAmount)} omdat u het hele jaar AOW ontvangt.
                                                                    </p>
                                                                </div>
                                                                {modalContent.inflationCorrection > 0 && (
                                                                    <div className="mt-3 p-3 bg-purple-900 bg-opacity-30 rounded border border-purple-700">
                                                                        <p className="text-xs text-purple-200 leading-relaxed">
                                                                            📈 <strong>Inflatiecorrectie:</strong> Het bovenstaande bedrag is gecorrigeerd met {formatPercent(modalContent.inflationCorrection)} inflatie per jaar.
                                                                            <br/><br/>
                                                                            Het oorspronkelijke jaarbedrag van {formatCurrency(modalContent.manualData.userAmount)} is vermenigvuldigd met een groeifactor van {Math.pow(1 + modalContent.inflationCorrection, modalContent.yearData.year - modalContent.startYear).toFixed(4)} (={formatPercent(modalContent.inflationCorrection)} over {modalContent.yearData.year - modalContent.startYear} {modalContent.yearData.year - modalContent.startYear === 1 ? 'jaar' : 'jaren'}).
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Partner AOW */}
                                            {modalContent.yearData.partnerAowActive && (
                                                <div className="bg-slate-700 p-4 rounded-lg border-2 border-blue-500">
                                                    <h4 className="text-blue-400 font-semibold mb-3">Partner AOW (handmatige berekening)</h4>
                                                    <div className="space-y-2 text-sm">
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-300">Jaarbedrag (bruto)</span>
                                                            <span className="text-white font-bold">{formatCurrency(modalContent.manualData.partnerAmount)}</span>
                                                        </div>
                                                        {modalContent.yearData.partnerAowFraction < 1 ? (
                                                            <>
                                                                <div className="flex justify-between items-center pt-2 border-t border-slate-600">
                                                                    <span className="text-slate-300">Fractie dit jaar</span>
                                                                    <span className="text-blue-400 font-semibold">{(modalContent.yearData.partnerAowFraction * 100).toFixed(1)}%</span>
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-slate-300">Bedrag dit jaar</span>
                                                                    <span className="text-white font-bold text-lg">{formatCurrency(modalContent.yearData.partnerAowFromManual)}</span>
                                                                </div>
                                                                <div className="mt-3 p-3 bg-blue-900 bg-opacity-30 rounded border border-blue-700">
                                                                    <p className="text-xs text-blue-200 leading-relaxed">
                                                                        ℹ️ <strong>Waarom is dit bedrag lager?</strong>
                                                                        <br/><br/>
                                                                        In {modalContent.yearData.year} ontvangt uw partner een lager bedrag dan de volledige AOW omdat de uitkering begint op {formatAOWDate(modalContent.manualData.partnerDate)} en dus niet een volledig jaar betreft.
                                                                        <br/><br/>
                                                                        Uw partner ontvangt {(modalContent.yearData.partnerAowFraction * 12).toFixed(1)} van de 12 maanden ({(modalContent.yearData.partnerAowFraction * 100).toFixed(1)}%).
                                                                        Het volledige jaarbedrag van {formatCurrency(modalContent.manualData.partnerAmount)} wordt daarom vermenigvuldigd met {(modalContent.yearData.partnerAowFraction * 100).toFixed(1)}%,
                                                                        wat neerkomt op {formatCurrency(modalContent.yearData.partnerAowFromManual)}.
                                                                    </p>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="flex justify-between items-center pt-2 border-t border-slate-600">
                                                                    <span className="text-slate-300">Bedrag dit jaar</span>
                                                                    <span className="text-white font-bold text-lg">{formatCurrency(modalContent.yearData.partnerAowFromManual)}</span>
                                                                </div>
                                                                <div className="mt-3 p-3 bg-green-900 bg-opacity-30 rounded border border-green-700">
                                                                    <p className="text-xs text-green-200 leading-relaxed">
                                                                        ✓ <strong>Volledig jaar:</strong> In {modalContent.yearData.year} ontvangt uw partner het volledige jaarbedrag van {formatCurrency(modalContent.manualData.partnerAmount)} omdat uw partner het hele jaar AOW ontvangt.
                                                                    </p>
                                                                </div>
                                                                {modalContent.inflationCorrection > 0 && (
                                                                    <div className="mt-3 p-3 bg-purple-900 bg-opacity-30 rounded border border-purple-700">
                                                                        <p className="text-xs text-purple-200 leading-relaxed">
                                                                            📈 <strong>Inflatiecorrectie:</strong> Het bovenstaande bedrag is gecorrigeerd met {formatPercent(modalContent.inflationCorrection)} inflatie per jaar.
                                                                            <br/><br/>
                                                                            Het oorspronkelijke jaarbedrag van {formatCurrency(modalContent.manualData.partnerAmount)} is vermenigvuldigd met een groeifactor van {Math.pow(1 + modalContent.inflationCorrection, modalContent.yearData.year - modalContent.startYear).toFixed(4)} (={formatPercent(modalContent.inflationCorrection)} over {modalContent.yearData.year - modalContent.startYear} {modalContent.yearData.year - modalContent.startYear === 1 ? 'jaar' : 'jaren'}).
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Total */}
                                            <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-4 rounded-lg">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-slate-900 font-semibold text-lg">Totaal AOW aftrek jaar {modalContent.yearData.year}</span>
                                                    <span className="text-slate-900 font-bold text-2xl">{formatCurrency(modalContent.yearData.aowDeduction)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {modalContent.type === 'present-value' && (
                                        <div className="space-y-4">
                                            {/* Header */}
                                            <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-4 rounded-lg">
                                                <h3 className="text-slate-900 font-bold text-xl">Contante Waarde</h3>
                                                <p className="text-slate-800 text-sm mt-1">Wat betekent dit bedrag?</p>
                                            </div>

                                            {/* Simple Explanation */}
                                            <div className="bg-slate-700 p-5 rounded-lg">
                                                <h4 className="text-white font-bold text-lg mb-4">💰 Wat is de contante waarde?</h4>
                                                <p className="text-base text-slate-200 leading-relaxed">
                                                    De contante waarde is het bedrag dat u <strong className="text-teal-400">vandaag</strong> moet hebben om al uw toekomstige opnames te betalen.
                                                </p>
                                            </div>

                                            {/* How it's calculated - Simple */}
                                            <div className="bg-slate-700 p-5 rounded-lg">
                                                <h4 className="text-white font-bold text-lg mb-4">🧮 Hoe berekenen we dit?</h4>
                                                <div className="space-y-4 text-slate-200">
                                                    <div className="flex items-start gap-3">
                                                        <span className="text-2xl">1️⃣</span>
                                                        <div>
                                                            <p className="font-semibold text-white mb-1">We nemen uw gewenste opnames per jaar</p>
                                                            <p className="text-sm text-slate-300">Inclusief inflatie en minus AOW/pensioen</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-start gap-3">
                                                        <span className="text-2xl">2️⃣</span>
                                                        <div>
                                                            <p className="font-semibold text-white mb-1">We rekenen terug naar vandaag</p>
                                                            <p className="text-sm text-slate-300">
                                                                Eerste {modalContent.savingsPeriod} jaar: 1,5% per jaar<br/>
                                                                Daarna: {formatPercent(modalContent.results.discountRate)} per jaar ({modalContent.discountProfile})
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-start gap-3">
                                                        <span className="text-2xl">3️⃣</span>
                                                        <div>
                                                            <p className="font-semibold text-white mb-1">We tellen alles bij elkaar op</p>
                                                            <p className="text-sm text-slate-300">Dit geeft het totale bedrag dat u nu nodig heeft</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Practical Example */}
                                            <div className="bg-slate-700 p-5 rounded-lg">
                                                <h4 className="text-white font-bold text-lg mb-4">💡 Simpel voorbeeld</h4>
                                                <div className="bg-slate-800 p-4 rounded-lg">
                                                    <p className="text-slate-200 mb-3">
                                                        Als u over 10 jaar <strong className="text-teal-400">€50.000</strong> nodig heeft:
                                                    </p>
                                                    <ul className="space-y-2 text-sm text-slate-300">
                                                        <li>→ Met 5% rendement per jaar</li>
                                                        <li>→ Heeft u vandaag <strong className="text-teal-400">€30.695</strong> nodig</li>
                                                        <li>→ Die €30.695 groeit in 10 jaar naar €50.000</li>
                                                    </ul>
                                                </div>
                                                <p className="text-sm text-slate-400 mt-3 italic">
                                                    Dit doen we voor elk jaar van uw opnames en tellen we op.
                                                </p>
                                            </div>

                                            {/* Total */}
                                            <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-5 rounded-lg">
                                                <div className="text-center">
                                                    <p className="text-slate-800 text-sm font-semibold mb-2">UW TOTALE CONTANTE WAARDE</p>
                                                    <p className="text-slate-900 font-bold text-3xl mb-2">
                                                        {formatCurrency(modalContent.results.totalPresentValue)}
                                                    </p>
                                                    <p className="text-slate-800 text-sm">
                                                        Dit bedrag heeft u vandaag nodig
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {modalContent.type === 'withdrawals-breakdown' && (
                                        <div className="space-y-4">
                                            {/* Header */}
                                            <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-4 rounded-lg">
                                                <h3 className="text-slate-900 font-bold text-xl">Jaarlijkse Onttrekkingen</h3>
                                                <p className="text-slate-800 text-sm mt-1">Contante waarde per jaar</p>
                                            </div>

                                            {/* Yearly withdrawals list */}
                                            <div className="bg-slate-700 p-5 rounded-lg max-h-96 overflow-y-auto">
                                                <div className="space-y-3">
                                                    {modalContent.results.yearByYear.map((row, idx) => (
                                                        <div key={idx} className="bg-slate-800 p-4 rounded-lg border border-slate-600">
                                                            <div className="flex justify-between items-center">
                                                                <div>
                                                                    <span className="text-teal-400 font-bold text-lg">Jaar {row.year}</span>
                                                                    <p className="text-slate-400 text-xs mt-1">Leeftijd: {row.userAge}{row.partnerAge ? ` / ${row.partnerAge}` : ''}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="text-white font-bold text-xl">{formatCurrency(row.presentValue)}</div>
                                                                    <div className="text-slate-400 text-xs mt-1">Contante waarde</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Total */}
                                            <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-5 rounded-lg">
                                                <div className="text-center">
                                                    <p className="text-slate-800 text-sm font-semibold mb-2">TOTAAL ONTTREKKINGEN</p>
                                                    <p className="text-slate-900 font-bold text-3xl mb-2">
                                                        {formatCurrency(modalContent.results.totalPresentValue)}
                                                    </p>
                                                    <p className="text-slate-800 text-sm">
                                                        Som van alle contante waardes
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-slate-700 px-6 py-4 flex justify-end">
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="px-6 py-2 bg-teal-500 text-slate-900 font-semibold rounded-lg hover:bg-teal-400 transition-colors"
                                    >
                                        Sluiten
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Instructions Modal for finding pension PDF */}
                    {showPensionInstructions && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowPensionInstructions(false)}>
                            <div className="bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full mx-4 border border-slate-700" onClick={(e) => e.stopPropagation()}>
                                <div className="bg-gradient-to-r from-teal-600 to-teal-500 px-6 py-4 flex justify-between items-center">
                                    <h2 className="text-xl font-bold text-slate-900">
                                        Hoe vind ik mijn pensioenoverzicht?
                                    </h2>
                                    <button
                                        onClick={() => setShowPensionInstructions(false)}
                                        className="text-slate-900 hover:text-slate-700 text-2xl font-bold leading-none"
                                    >
                                        ×
                                    </button>
                                </div>

                                <div className="p-6 max-h-[70vh] overflow-y-auto">
                                    <div className="space-y-6">
                                        <div className="bg-slate-700 p-4 rounded-lg">
                                            <h3 className="text-teal-400 font-semibold text-lg mb-3">Stap-voor-stap instructies:</h3>

                                            <ol className="space-y-4 text-slate-300">
                                                <li className="flex gap-3">
                                                    <span className="flex-shrink-0 w-8 h-8 bg-teal-500 text-slate-900 rounded-full flex items-center justify-center font-bold">1</span>
                                                    <div>
                                                        <p className="font-semibold text-white mb-1">Ga naar Mijnpensioenoverzicht.nl</p>
                                                        <p className="text-sm text-slate-400">Bezoek de officiële website: <a href="https://www.mijnpensioenoverzicht.nl" target="_blank" className="text-teal-400 hover:text-teal-300 underline">www.mijnpensioenoverzicht.nl</a></p>
                                                    </div>
                                                </li>

                                                <li className="flex gap-3">
                                                    <span className="flex-shrink-0 w-8 h-8 bg-teal-500 text-slate-900 rounded-full flex items-center justify-center font-bold">2</span>
                                                    <div>
                                                        <p className="font-semibold text-white mb-1">Log in met DigiD</p>
                                                        <p className="text-sm text-slate-400">Klik op "Inloggen" en gebruik uw DigiD om in te loggen</p>
                                                    </div>
                                                </li>

                                                <li className="flex gap-3">
                                                    <span className="flex-shrink-0 w-8 h-8 bg-teal-500 text-slate-900 rounded-full flex items-center justify-center font-bold">3</span>
                                                    <div>
                                                        <p className="font-semibold text-white mb-1">Bekijk uw pensioenoverzicht</p>
                                                        <p className="text-sm text-slate-400">Na het inloggen ziet u een overzicht van al uw pensioenregelingen</p>
                                                    </div>
                                                </li>

                                                <li className="flex gap-3">
                                                    <span className="flex-shrink-0 w-8 h-8 bg-teal-500 text-slate-900 rounded-full flex items-center justify-center font-bold">4</span>
                                                    <div>
                                                        <p className="font-semibold text-white mb-1">Download als PDF</p>
                                                        <p className="text-sm text-slate-400">Zoek naar de optie "Download PDF" of "Exporteer als PDF" en sla het bestand op</p>
                                                    </div>
                                                </li>

                                                <li className="flex gap-3">
                                                    <span className="flex-shrink-0 w-8 h-8 bg-teal-500 text-slate-900 rounded-full flex items-center justify-center font-bold">5</span>
                                                    <div>
                                                        <p className="font-semibold text-white mb-1">Upload het bestand</p>
                                                        <p className="text-sm text-slate-400">Kom terug naar deze pagina en upload het PDF bestand dat u zojuist heeft gedownload</p>
                                                    </div>
                                                </li>
                                            </ol>
                                        </div>

                                        <div className="bg-blue-900 bg-opacity-30 p-4 rounded-lg border border-blue-700">
                                            <p className="text-sm text-blue-200 leading-relaxed">
                                                <strong>💡 Tip:</strong> Het pensioenoverzicht bevat informatie over uw AOW en eventuele aanvullende pensioenen.
                                                Het systeem leest automatisch de relevante gegevens uit uw PDF.
                                            </p>
                                        </div>

                                        <div className="bg-amber-900 bg-opacity-30 p-4 rounded-lg border border-amber-700">
                                            <p className="text-sm text-amber-200 leading-relaxed">
                                                <strong>⚠️ Let op:</strong> U heeft een DigiD nodig om in te loggen op Mijnpensioenoverzicht.nl.
                                                Heeft u nog geen DigiD? Vraag deze aan via <a href="https://www.digid.nl" target="_blank" className="text-amber-300 hover:text-amber-200 underline">www.digid.nl</a>
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-700 px-6 py-4 flex justify-end">
                                    <button
                                        onClick={() => setShowPensionInstructions(false)}
                                        className="px-6 py-2 bg-teal-500 text-slate-900 font-semibold rounded-lg hover:bg-teal-400 transition-colors"
                                    >
                                        Begrepen
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        }


export default IncomePreservationCalculator;
