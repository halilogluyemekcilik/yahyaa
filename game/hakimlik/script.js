// HMGS için özel yapı - ders bazlı değil, sadece toplam soru (120 soru, 4 yanlış bir doğruyu götürmüyor)
const HMGS_CONFIG = {
    totalQuestions: 120,
    hasSubjects: false // Ders bazlı değil
};

// Hakimlik/Savcılık dersleri ve soru sayıları
const HAKIMLIK_SAVCILIK_SUBJECTS = [
    { name: 'Genel Kültür', questionCount: 30 },
    { name: 'Ortak Alan', questionCount: 35 },
    { name: 'Yargı', questionCount: 35 }
];

// Sınav sonuçlarını localStorage'da saklayacağız
let examResults = [];
let currentExam = null;
let activeSubjects = HAKIMLIK_SAVCILIK_SUBJECTS; // Başlangıçta Hakimlik/Savcılık varsayılan
let netChart, subjectChart; // Grafik nesneleri

// LocalStorage'dan verileri güvenli şekilde yükle
try {
    const storedData = localStorage.getItem('examResults');
    if (storedData) {
        examResults = JSON.parse(storedData);
        if (!Array.isArray(examResults)) {
            examResults = [];
        }
    }
} catch (error) {
    console.error('LocalStorage veri yükleme hatası:', error);
    examResults = [];
    localStorage.removeItem('examResults');
}

// DOM elementlerini seçelim
const examForm = document.getElementById('examForm');
const examTableBody = document.getElementById('examTableBody');
const totalCorrect = document.getElementById('totalCorrect');
const totalWrong = document.getElementById('totalWrong');
const totalNet = document.getElementById('totalNet');
const totalScore = document.getElementById('totalScore');
const savedExams = document.getElementById('savedExams');
const totalExams = document.getElementById('totalExams');
const averageScore = document.getElementById('averageScore');
const bestSubject = document.getElementById('bestSubject');
const currentExamDiv = document.getElementById('currentExam');
const currentExamName = document.getElementById('currentExamName');
const currentExamDate = document.getElementById('currentExamDate');
const currentExamTotal = document.getElementById('currentExamTotal');
const currentExamType = document.getElementById('currentExamType');
const examTypeSelect = document.getElementById('examType');
const totalQuestionsInput = document.getElementById('totalQuestions');
const graphsSection = document.getElementById('graphsSection');

// Sayfa yüklendiğinde mevcut sonuçları göster
document.addEventListener('DOMContentLoaded', function () {
    // Varsayılan olarak Hakimlik/Savcılık seçili
    const examTypeSelect = document.getElementById('examType');
    examTypeSelect.value = 'hakimlik-savcilik';
    activeSubjects = HAKIMLIK_SAVCILIK_SUBJECTS;

    updateTotalQuestions();
    createExamTable();
    updateDisplay();
    setDefaultDate();
});

// Sınav türü değiştiğinde ders tablosunu ve toplam soru sayısını güncelle
examTypeSelect.addEventListener('change', function () {
    const selectedType = this.value;

    if (selectedType === 'hmgs') {
        activeSubjects = null; // HMGS için ders bazlı değil
        updateHMGSInterface();
    } else {
        activeSubjects = HAKIMLIK_SAVCILIK_SUBJECTS;
        updateTotalQuestions();
        createExamTable();
        updateTotals();
    }

    renderCharts(selectedType); // Seçilen türe göre grafikleri yeniden çiz
});

// Toplam soru sayısını güncelle
function updateTotalQuestions() {
    const examType = document.getElementById('examType').value;
    if (examType === 'hmgs') {
        totalQuestionsInput.value = HMGS_CONFIG.totalQuestions;
    } else if (activeSubjects) {
        const newTotalQuestions = activeSubjects.reduce((sum, subject) => sum + subject.questionCount, 0);
        totalQuestionsInput.value = newTotalQuestions;
    }
}

// HMGS arayüzünü güncelle
function updateHMGSInterface() {
    updateTotalQuestions();
    const tableContainer = document.querySelector('.exam-table-container');
    if (tableContainer) {
        tableContainer.style.display = 'none';
        tableContainer.innerHTML = '';
    }
}

// Form gönderildiğinde yeni sınavı başlat
examForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const examName = document.getElementById('examName').value.trim();
    const examDate = document.getElementById('examDate').value;
    const examType = document.getElementById('examType').value;
    const totalQuestions = parseInt(totalQuestionsInput.value) || 0;

    // Validasyonlar
    if (!examName) {
        showErrorMessage('Lütfen sınav adını girin!');
        document.getElementById('examName').focus();
        return;
    }

    if (examName.length > 50) {
        showErrorMessage('Sınav adı en fazla 50 karakter olabilir!');
        document.getElementById('examName').focus();
        return;
    }

    if (!examDate) {
        showErrorMessage('Lütfen sınav tarihini seçin!');
        document.getElementById('examDate').focus();
        return;
    }

    // Gelecek tarih kontrolü
    const selectedDate = new Date(examDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
        if (!confirm('Seçilen tarih gelecekte. Devam etmek istiyor musunuz?')) {
            return;
        }
    }

    // Aktif sınav kontrolü
    if (currentExam) {
        if (!confirm('Aktif bir sınav var. Yeni sınav başlatılırsa mevcut sınav iptal edilecek. Devam edilsin mi?')) {
            return;
        }
    }

    currentExam = {
        id: Date.now(),
        name: examName,
        date: examDate,
        type: examType,
        totalQuestions: totalQuestions,
        subjects: {},
        timestamp: new Date().toISOString()
    };

    // HMGS için özel işlem
    if (examType === 'hmgs') {
        // HMGS'de ders bazlı değil, sadece toplam doğru/yanlış var
        currentExam.isHMGS = true;
        currentExam.totalCorrect = 0;
        currentExam.totalWrong = 0;
        currentExam.totalNet = 0;
    } else {
        // Hakimlik/Savcılık için ders bazlı
        activeSubjects.forEach(subject => {
            currentExam.subjects[subject.name] = {
                correct: 0,
                wrong: 0,
                questionCount: subject.questionCount
            };
        });
    }

    currentExamName.textContent = examName;
    currentExamType.textContent = getExamTypeDisplayName(examType);
    currentExamDate.textContent = new Date(examDate).toLocaleDateString('tr-TR');
    currentExamTotal.textContent = totalQuestions > 0 ? totalQuestions : 'Belirtilmemiş';
    currentExamDiv.style.display = 'block';

    examForm.style.display = 'none';

    // HMGS için özel arayüz, diğerleri için ders tablosu
    if (examType === 'hmgs') {
        showHMGSInput();
    } else {
        const tableContainer = document.querySelector('.exam-table-container');
        if (tableContainer) {
            tableContainer.style.display = 'block';
        }
        createExamTable();
    }

    showSuccessMessage('Sınav başlatıldı! Doğru/yanlış sayılarını girebilirsiniz.');
});

// Sınav tablosunu oluştur (sadece Hakimlik/Savcılık için)
function createExamTable() {
    if (!activeSubjects) return; // HMGS için ders tablosu yok
    examTableBody.innerHTML = '';

    activeSubjects.forEach(subject => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="subject-name">${subject.name} (${subject.questionCount})</td>
            <td>
                <input type="number" class="subject-input correct-input" 
                        data-subject="${subject.name}" min="0" max="${subject.questionCount}" value="0" 
                        oninput="updateTotals()">
            </td>
            <td>
                <input type="number" class="subject-input wrong-input" 
                        data-subject="${subject.name}" min="0" max="${subject.questionCount}" value="0" 
                        oninput="updateTotals()">
            </td>
            <td class="net-cell">0</td>
            <td class="score-cell">%0</td>
        `;
        examTableBody.appendChild(row);
    });
    updateTotals();
}

// HMGS için özel arayüz göster
function showHMGSInput() {
    const tableContainer = document.querySelector('.exam-table-container');
    if (tableContainer) {
        tableContainer.innerHTML = `
            <h3>HMGS Sınav Sonuçları</h3>
            <div class="hmgs-input-section">
                <div class="form-group">
                    <label for="hmgsCorrect">Doğru Sayısı:</label>
                    <input type="number" id="hmgsCorrect" min="0" max="${HMGS_CONFIG.totalQuestions}" value="0" 
                           oninput="updateHMGSTotals()" class="subject-input" style="width: 100%; padding: 12px;">
                </div>
                <div class="form-group">
                    <label for="hmgsWrong">Yanlış Sayısı:</label>
                    <input type="number" id="hmgsWrong" min="0" max="${HMGS_CONFIG.totalQuestions}" value="0" 
                           oninput="updateHMGSTotals()" class="subject-input" style="width: 100%; padding: 12px;">
                </div>
                <div class="hmgs-summary">
                    <div class="stat-row">
                        <span>Toplam Soru:</span>
                        <strong>${HMGS_CONFIG.totalQuestions}</strong>
                    </div>
                    <div class="stat-row">
                        <span>Doğru:</span>
                        <strong id="hmgsTotalCorrect">0</strong>
                    </div>
                    <div class="stat-row">
                        <span>Yanlış:</span>
                        <strong id="hmgsTotalWrong">0</strong>
                    </div>
                    <div class="stat-row">
                        <span>Boş:</span>
                        <strong id="hmgsEmpty">${HMGS_CONFIG.totalQuestions}</strong>
                    </div>
                    <div class="stat-row" style="background: #f7fafc; border: 2px solid #667eea; border-radius: 8px;">
                        <span style="font-weight: 700; color: #2d3748;">Net:</span>
                        <strong id="hmgsTotalNet" style="font-size: 1.5rem; color: #667eea;">0</strong>
                    </div>
                    <div class="stat-row">
                        <span>Başarı:</span>
                        <strong id="hmgsScore" style="font-size: 1.2rem;">%0</strong>
                    </div>
                </div>
            </div>
        `;
        tableContainer.style.display = 'block';
        updateHMGSTotals();
    }
}

// HMGS toplamlarını güncelle
function updateHMGSTotals() {
    if (!currentExam || currentExam.type !== 'hmgs') return;

    const correctInput = document.getElementById('hmgsCorrect');
    const wrongInput = document.getElementById('hmgsWrong');

    if (!correctInput || !wrongInput) return;

    let correct = parseInt(correctInput.value) || 0;
    let wrong = parseInt(wrongInput.value) || 0;

    // Validasyon: Doğru + Yanlış <= Toplam Soru
    if (correct + wrong > HMGS_CONFIG.totalQuestions) {
        const diff = (correct + wrong) - HMGS_CONFIG.totalQuestions;
        if (wrong >= diff) {
            wrong = HMGS_CONFIG.totalQuestions - correct;
        } else {
            correct = HMGS_CONFIG.totalQuestions - wrong;
        }
        correctInput.value = correct;
        wrongInput.value = wrong;
        showWarningMessage(`Toplam cevaplanan soru sayısı ${HMGS_CONFIG.totalQuestions}'i aşamaz!`);
    }

    // HMGS'de 4 yanlış bir doğruyu götürmüyor, net sadece doğru sayısı
    const net = correct; // Yanlışlar net'i etkilemiyor
    const empty = HMGS_CONFIG.totalQuestions - correct - wrong;
    const score = HMGS_CONFIG.totalQuestions > 0 ? Math.round((correct / HMGS_CONFIG.totalQuestions) * 100) : 0;

    // UI güncelle
    document.getElementById('hmgsTotalCorrect').textContent = correct;
    document.getElementById('hmgsTotalWrong').textContent = wrong;
    document.getElementById('hmgsEmpty').textContent = empty;
    document.getElementById('hmgsTotalNet').textContent = net;

    const scoreElement = document.getElementById('hmgsScore');
    scoreElement.textContent = `%${score}`;

    // Renklendirme
    if (score >= 80) {
        scoreElement.style.color = '#38a169';
    } else if (score >= 50) {
        scoreElement.style.color = '#d69e2e';
    } else {
        scoreElement.style.color = '#e53e3e';
    }

    // Current exam'i güncelle
    currentExam.totalCorrect = correct;
    currentExam.totalWrong = wrong;
    currentExam.totalNet = net;
    currentExam.totalScore = score;
    currentExam.emptyQuestions = empty;
}

// Toplamları güncelle (Hakimlik/Savcılık için)
function updateTotals() {
    if (!currentExam || currentExam.type === 'hmgs') return;
    if (!activeSubjects) return;

    let totalCorrectCount = 0;
    let totalWrongCount = 0;
    let totalNetCount = 0;

    activeSubjects.forEach(subject => {
        const correctInput = document.querySelector(`input[data-subject="${subject.name}"].correct-input`);
        const wrongInput = document.querySelector(`input[data-subject="${subject.name}"].wrong-input`);

        if (correctInput && wrongInput) {
            let correct = parseInt(correctInput.value) || 0;
            let wrong = parseInt(wrongInput.value) || 0;

            // Validasyon: Doğru + Yanlış, toplam soru sayısını aşamaz
            const maxAnswered = subject.questionCount;
            if (correct + wrong > maxAnswered) {
                const diff = (correct + wrong) - maxAnswered;
                if (wrong >= diff) {
                    wrong = maxAnswered - correct;
                } else {
                    correct = maxAnswered - wrong;
                }
                correctInput.value = correct;
                wrongInput.value = wrong;
                showWarningMessage(`${subject.name} için toplam cevaplanan soru sayısı ${maxAnswered}'i aşamaz!`);
            }

            const net = correct - (wrong / 4);
            const score = (net / subject.questionCount) * 100;

            currentExam.subjects[subject.name] = {
                correct,
                wrong,
                net: parseFloat(net),
                questionCount: subject.questionCount
            };

            const row = correctInput.closest('tr');
            const netCell = row.querySelector('.net-cell');
            const scoreCell = row.querySelector('.score-cell');

            if (netCell) {
                const netValue = Math.max(0, net).toFixed(2);
                netCell.textContent = netValue;
                // Net değerine göre renklendirme
                if (net >= subject.questionCount * 0.8) {
                    netCell.style.color = '#38a169';
                    netCell.style.fontWeight = '700';
                } else if (net >= subject.questionCount * 0.5) {
                    netCell.style.color = '#d69e2e';
                    netCell.style.fontWeight = '600';
                } else {
                    netCell.style.color = '#e53e3e';
                    netCell.style.fontWeight = '500';
                }
            }

            if (scoreCell) {
                const scoreValue = Math.max(0, score).toFixed(0);
                scoreCell.textContent = `%${scoreValue}`;
                // Başarı yüzdesine göre renklendirme
                if (score >= 80) {
                    scoreCell.style.color = '#38a169';
                } else if (score >= 50) {
                    scoreCell.style.color = '#d69e2e';
                } else {
                    scoreCell.style.color = '#e53e3e';
                }
            }

            totalCorrectCount += correct;
            totalWrongCount += wrong;
            totalNetCount += net;
        }
    });

    totalCorrect.textContent = totalCorrectCount;
    totalWrong.textContent = totalWrongCount;
    totalNet.textContent = Math.max(0, totalNetCount).toFixed(2);

    const totalQuestions = activeSubjects.reduce((sum, subject) => sum + subject.questionCount, 0);
    const totalScorePercent = totalQuestions > 0 ? Math.round((totalNetCount / totalQuestions) * 100) : 0;

    totalScore.textContent = `%${Math.max(0, totalScorePercent)}`;

    // Genel net'e göre renklendirme
    if (totalScorePercent >= 80) {
        totalScore.style.color = '#38a169';
        totalScore.style.fontWeight = '700';
    } else if (totalScorePercent >= 50) {
        totalScore.style.color = '#d69e2e';
        totalScore.style.fontWeight = '600';
    } else {
        totalScore.style.color = '#e53e3e';
        totalScore.style.fontWeight = '500';
    }
}

// Sınavı bitir ve kaydet
function finishExam() {
    if (!currentExam) {
        showErrorMessage('Aktif bir sınav bulunamadı!');
        return;
    }

    // HMGS için özel işlem
    if (currentExam.type === 'hmgs') {
        const correct = currentExam.totalCorrect || 0;
        const wrong = currentExam.totalWrong || 0;
        const totalAnswered = correct + wrong;

        if (totalAnswered === 0) {
            showErrorMessage('En az bir soru cevaplanmalı!');
            return;
        }

        // HMGS verileri zaten güncellenmiş durumda (updateHMGSTotals'da)
    } else {
        // Hakimlik/Savcılık için ders bazlı kontrol
        const totalCorrectCount = parseInt(totalCorrect.textContent) || 0;
        const totalWrongCount = parseInt(totalWrong.textContent) || 0;
        const totalAnswered = totalCorrectCount + totalWrongCount;

        if (totalAnswered === 0) {
            showErrorMessage('En az bir soru cevaplanmalı!');
            return;
        }

        // Her ders için kontrol: Doğru + Yanlış <= Toplam Soru
        let hasError = false;
        if (activeSubjects) {
            activeSubjects.forEach(subject => {
                const subjectData = currentExam.subjects[subject.name];
                if (subjectData) {
                    if (subjectData.correct + subjectData.wrong > subject.questionCount) {
                        hasError = true;
                    }
                }
            });
        }

        if (hasError) {
            showErrorMessage('Bazı derslerde hatalı veri var. Lütfen kontrol edin!');
            return;
        }

        // Veri hazırlığı
        currentExam.totalNet = parseFloat(totalNet.textContent);
        currentExam.totalCorrect = totalCorrectCount;
        currentExam.totalWrong = totalWrongCount;
        currentExam.totalScore = parseInt(totalScore.textContent.replace('%', ''));
        currentExam.answeredQuestions = totalAnswered;
        currentExam.emptyQuestions = currentExam.totalQuestions - totalAnswered;
    }

    // LocalStorage veri sınırı kontrolü
    try {
        examResults.push(currentExam);
        saveToLocalStorage();
    } catch (error) {
        if (error.name === 'QuotaExceededError') {
            showErrorMessage('Veri sınırı aşıldı! Eski sınavları silin veya verilerinizi dışa aktarın.');
            examResults.pop();
            return;
        }
        showErrorMessage('Veri kaydedilirken hata oluştu: ' + error.message);
        return;
    }

    showSuccessMessage(`Sınav "${currentExam.name}" başarıyla kaydedildi! 🎉`);

    // Formu temizle ve yenile
    examForm.reset();
    updateTotalQuestions();
    examForm.style.display = 'block';
    currentExamDiv.style.display = 'none';
    currentExam = null;

    // Tabloyu gizle
    const tableContainer = document.querySelector('.exam-table-container');
    if (tableContainer) {
        tableContainer.style.display = 'none';
    }

    // Varsayılan ayarlara dön - Hakimlik/Savcılık
    document.getElementById('examType').value = 'hakimlik-savcilik';
    activeSubjects = HAKIMLIK_SAVCILIK_SUBJECTS;
    const examTableContainer = document.querySelector('.exam-table-container');
    if (examTableContainer) {
        examTableContainer.style.display = 'none';
    }
    createExamTable();
    updateDisplay();
    setDefaultDate();

    // Kaydedilen sınavlar listesine scroll
    setTimeout(() => {
        const savedExamsSection = document.querySelector('.recent-exams');
        if (savedExamsSection) {
            savedExamsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 300);
}

// LocalStorage'a kaydet
function saveToLocalStorage() {
    try {
        const dataString = JSON.stringify(examResults);
        localStorage.setItem('examResults', dataString);
        // Backup da kaydet (son 100 sınav)
        const backupData = examResults.slice(-100);
        localStorage.setItem('examResultsBackup', JSON.stringify(backupData));
    } catch (error) {
        console.error('LocalStorage kayıt hatası:', error);
        throw error;
    }
}

// Ekranı güncelle
function updateDisplay() {
    updateStats();
    updateSavedExams();
    renderCharts(examTypeSelect.value);
}

// İstatistikleri güncelle
function updateStats() {
    totalExams.textContent = examResults.length;

    if (examResults.length === 0) {
        averageScore.textContent = '%0';
        bestSubject.textContent = '-';
        const highestNetElement = document.getElementById('highestNet');
        if (highestNetElement) highestNetElement.textContent = '0';
        return;
    }

    let totalNetSum = 0;
    let totalQuestionsSum = 0;
    let allSubjectScores = {};
    let highestNet = 0;
    let highestNetExam = null;

    examResults.forEach(exam => {
        const examNet = exam.totalNet || 0;
        if (examNet > highestNet) {
            highestNet = examNet;
            highestNetExam = exam;
        }

        totalNetSum += examNet;
        totalQuestionsSum += exam.totalQuestions || 0;

        // Sadece Hakimlik/Savcılık için ders bazlı istatistik
        if (exam && exam.subjects && typeof exam.subjects === 'object' && !exam.isHMGS) {
            Object.keys(exam.subjects).forEach(subjectName => {
                if (!allSubjectScores[subjectName]) {
                    allSubjectScores[subjectName] = { totalNet: 0, totalQuestions: 0, count: 0 };
                }
                const subjectData = exam.subjects[subjectName];
                const subjectInfo = findSubjectInfo(subjectName);
                if (subjectData && subjectInfo) {
                    allSubjectScores[subjectName].totalNet += subjectData.net || 0;
                    allSubjectScores[subjectName].totalQuestions += subjectInfo.questionCount;
                    allSubjectScores[subjectName].count++;
                }
            });
        }
    });

    const avgScore = totalQuestionsSum > 0 ? Math.round((totalNetSum / totalQuestionsSum) * 100) : 0;
    averageScore.textContent = `%${Math.max(0, avgScore)}`;

    let bestSubjectName = '-';
    let bestSubjectAvg = -1;

    Object.keys(allSubjectScores).forEach(subjectName => {
        const stats = allSubjectScores[subjectName];
        if (stats.count > 0 && stats.totalQuestions > 0) {
            const avg = Math.round((stats.totalNet / stats.totalQuestions) * 100);
            if (avg > bestSubjectAvg) {
                bestSubjectAvg = avg;
                bestSubjectName = subjectName;
            }
        }
    });

    bestSubject.textContent = bestSubjectName;

    // En yüksek net'i göster
    const highestNetElement = document.getElementById('highestNet');
    if (highestNetElement) {
        highestNetElement.textContent = highestNet.toFixed(2);
        if (highestNetExam) {
            highestNetElement.title = `En yüksek net: ${highestNetExam.name} (${getExamTypeDisplayName(highestNetExam.type)})`;
        }
    }
}

// Kaydedilen sınavları güncelle
let currentFilter = 'all';

function updateSavedExams() {
    if (examResults.length === 0) {
        savedExams.innerHTML = '<p style="text-align: center; color: #718096; padding: 20px;">Henüz sınav kaydedilmemiş. Yeni bir sınav başlatın!</p>';
        return;
    }

    // Filtreleme
    let filteredExams = examResults;
    if (currentFilter !== 'all') {
        filteredExams = examResults.filter(exam => exam.type === currentFilter);
    }

    if (filteredExams.length === 0) {
        const filterDisplayName = currentFilter === 'all' ? 'Henüz sınav yok' :
            currentFilter === 'hmgs' ? 'HMGS sınavı bulunmuyor' :
                'Hakimlik/Savcılık sınavı bulunmuyor';
        savedExams.innerHTML = `<p style="text-align: center; color: #718096; padding: 20px;">${filterDisplayName}.</p>`;
        return;
    }

    const sortedExams = [...filteredExams].sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date));

    savedExams.innerHTML = '';
    sortedExams.forEach(exam => {
        if (!exam || !exam.subjects || typeof exam.subjects !== 'object') {
            console.warn('Geçersiz sınav verisi:', exam);
            return;
        }

        const examDate = new Date(exam.date).toLocaleDateString('tr-TR');
        const examItem = document.createElement('div');
        examItem.className = 'exam-item';
        examItem.innerHTML = `
            <div class="exam-info">
                <div class="exam-subject">${exam.name} <span class="exam-type">(${exam.type.toUpperCase()})</span></div>
                <div class="exam-date">${examDate}</div>
                <div class="exam-details">
                    <span class="detail-item">Doğru: <strong>${exam.totalCorrect}</strong></span>
                    <span class="detail-item">Yanlış: <strong>${exam.totalWrong}</strong></span>
                    <span class="detail-item">Net: <strong>${(exam.totalNet || 0).toFixed(2)}</strong></span>
                </div>
                <div class="exam-scores">
                    <span class="score-item">Başarı: <strong>%${exam.totalScore}</strong></span>
                </div>
            </div>
            <div class="exam-actions">
                <button class="detail-btn" onclick="showExamDetails(${exam.id})">📋 Detay</button>
                <button class="delete-btn" onclick="deleteExam(${exam.id})">Sil</button>
            </div>
        `;

        savedExams.appendChild(examItem);
    });
}

// Sınav detaylarını göster (modal)
function showExamDetails(examId) {
    const exam = examResults.find(e => e.id === examId);
    if (!exam) return;

    const examDate = new Date(exam.date).toLocaleDateString('tr-TR');

    const modal = document.createElement('div');
    modal.className = 'exam-detail-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>📋 ${exam.name} - Sınav Detayları (${exam.type.toUpperCase()})</h3>
                <button class="close-btn">✕</button>
            </div>
            <div class="modal-body">
                <div class="exam-summary">
                    <p><strong>Tarih:</strong> ${examDate}</p>
                    <p><strong>Toplam Puan:</strong> %${exam.totalScore}</p>
                    <p><strong>Genel Doğru:</strong> ${exam.totalCorrect}</p>
                    <p><strong>Genel Yanlış:</strong> ${exam.totalWrong}</p>
                    <p><strong>Genel Net:</strong> ${(exam.totalNet || 0).toFixed(2)}</p>
                </div>
                <div class="subject-details">
                    <h4>Ders Bazında Detaylar:</h4>
                    <div class="subject-list">
                        ${Object.keys(exam.subjects).map(subjectName => {
        const subjectData = exam.subjects[subjectName];
        if (subjectData) {
            const subjectInfo = findSubjectInfo(subjectName);
            const correct = subjectData.correct || 0;
            const wrong = subjectData.wrong || 0;
            const net = subjectData.net || 0;
            const subjectScore = subjectInfo?.questionCount > 0 ? Math.round((net / subjectInfo.questionCount) * 100) : 0;
            return `
                                    <div class="subject-detail-item">
                                        <div class="subject-name">${subjectName} (${subjectInfo?.questionCount || '?'})</div>
                                        <div class="subject-results">
                                            <span class="correct">Doğru: ${correct}</span>
                                            <span class="wrong">Yanlış: ${wrong}</span>
                                            <span class="net">Net: ${net.toFixed(2)}</span>
                                            <span class="score">Başarı: %${Math.max(0, subjectScore)}</span>
                                        </div>
                                    </div>
                                `;
        }
        return '';
    }).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
        modal.remove();
    });

    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Sınav sonucunu sil
function deleteExam(id) {
    if (confirm('Bu sınav sonucunu silmek istediğinizden emin misiniz?')) {
        examResults = examResults.filter(result => result.id !== id);
        saveToLocalStorage();
        updateDisplay();
        showSuccessMessage('Sınav sonucu silindi!');
    }
}

// Bugünün tarihini varsayılan olarak ayarla
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    const examDateInput = document.getElementById('examDate');
    if (examDateInput && !examDateInput.value) {
        examDateInput.value = today;
    }
}

// Başarı mesajı göster
function showSuccessMessage(message) {
    showToast(message, 'success');
}

// Hata mesajı göster
function showErrorMessage(message) {
    showToast(message, 'error');
}

// Uyarı mesajı göster
function showWarningMessage(message) {
    showToast(message, 'warning');
}

// Bilgi mesajı göster
function showInfoMessage(message) {
    showToast(message, 'info');
}

// Gelişmiş toast notification sistemi
function showToast(message, type = 'info') {
    // Eski toast'ları temizle
    const existingToasts = document.querySelectorAll('.toast-message');
    existingToasts.forEach(toast => {
        toast.remove();
    });

    const toast = document.createElement('div');
    toast.className = `toast-message toast-${type}`;

    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-text">${message}</span>
        </div>
    `;

    document.body.appendChild(toast);

    // Animasyon
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // Otomatik kapanma
    const duration = type === 'error' ? 5000 : 3000;
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, duration);
}

// Grafik oluşturma ve güncelleme fonksiyonu - GÜNCELLENDİ
function renderCharts(examType = 'hmgs') {
    const netChartCtx = document.getElementById('netChart').getContext('2d');
    const subjectChartCtx = document.getElementById('subjectChart').getContext('2d');

    const filteredExams = examResults.filter(exam => exam.type === examType);

    if (filteredExams.length === 0) {
        graphsSection.style.display = 'none';
        return;
    } else {
        graphsSection.style.display = 'block';
    }

    // --- 1. Net Gelişim Grafiği (Çizgi Grafik) ---
    const sortedExams = [...filteredExams].sort((a, b) => new Date(a.date) - new Date(b.date));
    const examLabels = sortedExams.map(e => `${e.name.split(' ')[0]}\n${e.date}`); // Mobilde daha kısa etiketler
    const examNets = sortedExams.map(e => e.totalNet);

    if (netChart) netChart.destroy();
    netChart = new Chart(netChartCtx, {
        type: 'line',
        data: {
            labels: examLabels,
            datasets: [{
                label: 'Toplam Net Gelişimi',
                data: examNets,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.2)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#667eea',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `${getExamTypeDisplayName(examType)} Net Gelişimi`,
                    font: {
                        size: window.innerWidth < 768 ? 14 : 16
                    }
                },
                legend: {
                    labels: {
                        boxWidth: 12,
                        font: {
                            size: window.innerWidth < 768 ? 12 : 14
                        }
                    }
                },
                tooltip: {
                    bodyFont: {
                        size: window.innerWidth < 768 ? 12 : 14
                    },
                    titleFont: {
                        size: window.innerWidth < 768 ? 14 : 16
                    },
                    callbacks: {
                        label: function (context) {
                            return `Net: ${context.raw.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Net Sayısı',
                        font: {
                            size: window.innerWidth < 768 ? 12 : 14
                        }
                    },
                    ticks: {
                        font: {
                            size: window.innerWidth < 768 ? 10 : 12
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Sınavlar',
                        font: {
                            size: window.innerWidth < 768 ? 12 : 14
                        }
                    },
                    ticks: {
                        font: {
                            size: window.innerWidth < 768 ? 10 : 12
                        },
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });

    // --- 2. Ders Bazlı Ortalama Başarı Grafiği (Çubuk Grafik) ---
    // HMGS için ders bazlı grafik yok
    if (examType === 'hmgs') {
        if (subjectChart) subjectChart.destroy();
        const hmgsSubjectChartCtx = document.getElementById('subjectChart').getContext('2d');
        const hmgsSubjectChartContainer = hmgsSubjectChartCtx.canvas.closest('.chart-container');
        if (hmgsSubjectChartContainer) {
            hmgsSubjectChartContainer.style.display = 'none';
        }
        return;
    }

    const hakimlikSubjectChartCtx = document.getElementById('subjectChart').getContext('2d');
    const hakimlikSubjectChartContainer = hakimlikSubjectChartCtx.canvas.closest('.chart-container');
    if (hakimlikSubjectChartContainer) {
        hakimlikSubjectChartContainer.style.display = 'block';
    }

    const subjectStats = {};
    const targetSubjects = HAKIMLIK_SAVCILIK_SUBJECTS;

    // Dersler için başlangıç istatistiklerini oluştur ve sıfırla
    targetSubjects.forEach(subject => {
        subjectStats[subject.name] = { totalNet: 0, totalQuestionCount: 0, totalExamCount: 0 };
    });

    // Her sınav sonucunu döngüye alarak ders istatistiklerini topla
    filteredExams.forEach(exam => {
        Object.keys(exam.subjects).forEach(subjectName => {
            if (subjectStats[subjectName]) {
                const subjectData = exam.subjects[subjectName];
                if (subjectData && typeof subjectData.net === 'number') {
                    subjectStats[subjectName].totalNet += subjectData.net;
                    subjectStats[subjectName].totalQuestionCount += subjectData.questionCount;
                    subjectStats[subjectName].totalExamCount++;
                }
            }
        });
    });

    // Ortalama başarıları hesapla
    const subjectLabels = [];
    const subjectScores = [];

    Object.keys(subjectStats).forEach(subjectName => {
        const stats = subjectStats[subjectName];
        if (stats.totalQuestionCount > 0) {
            const avgScore = (stats.totalNet / stats.totalQuestionCount) * 100;
            // Mobilde daha kısa ders adları
            const shortName = window.innerWidth < 768 ?
                subjectName.replace('Türk Dili ve Edebiyatı', 'TDE')
                    .replace('Matematik', 'Mat')
                    .replace('Felsefe Grubu', 'Felsefe')
                    .replace('Din Kültürü', 'Din')
                    .replace('Coğrafya', 'Coğ') :
                subjectName;
            subjectLabels.push(shortName);
            subjectScores.push(Math.max(0, avgScore));
        } else if (stats.totalExamCount > 0) {
            const shortName = window.innerWidth < 768 ?
                subjectName.replace('Türk Dili ve Edebiyatı', 'TDE')
                    .replace('Matematik', 'Mat')
                    .replace('Felsefe Grubu', 'Felsefe')
                    .replace('Din Kültürü', 'Din')
                    .replace('Coğrafya', 'Coğ') :
                subjectName;
            subjectLabels.push(shortName);
            subjectScores.push(0);
        }
    });

    if (subjectChart) subjectChart.destroy();
    subjectChart = new Chart(hakimlikSubjectChartCtx, {
        type: 'bar',
        data: {
            labels: subjectLabels,
            datasets: [{
                label: 'Ortalama Başarı (%)',
                data: subjectScores,
                backgroundColor: '#38a169',
                borderColor: '#2f855a',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: window.innerWidth < 768 ? 'y' : 'x', // Mobilde yatay çubuklar
            plugins: {
                title: {
                    display: true,
                    text: `${getExamTypeDisplayName(examType)} Ders Başarıları`,
                    font: {
                        size: window.innerWidth < 768 ? 14 : 16
                    }
                },
                legend: {
                    labels: {
                        boxWidth: 12,
                        font: {
                            size: window.innerWidth < 768 ? 12 : 14
                        }
                    }
                },
                tooltip: {
                    bodyFont: {
                        size: window.innerWidth < 768 ? 12 : 14
                    },
                    titleFont: {
                        size: window.innerWidth < 768 ? 14 : 16
                    },
                    callbacks: {
                        label: function (context) {
                            return `Başarı: %${context.raw.toFixed(1)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Başarı (%)',
                        font: {
                            size: window.innerWidth < 768 ? 12 : 14
                        }
                    },
                    ticks: {
                        font: {
                            size: window.innerWidth < 768 ? 10 : 12
                        }
                    }
                },
                y: {
                    ticks: {
                        font: {
                            size: window.innerWidth < 768 ? 10 : 12
                        },
                        autoSkip: false
                    }
                }
            }
        }
    });
}

// Yardımcı fonksiyon: tüm ders listeleri arasında ders bilgisi bul
function findSubjectInfo(subjectName) {
    // Sadece Hakimlik/Savcılık dersleri var
    const allSubjects = [...HAKIMLIK_SAVCILIK_SUBJECTS];
    return allSubjects.find(s => s.name === subjectName);
}

// Sınav türü görünen adını döndür
function getExamTypeDisplayName(examType) {
    const typeMap = {
        'hmgs': 'HMGS',
        'hakimlik-savcilik': 'Hakimlik/Savcılık'
    };
    return typeMap[examType] || examType.toUpperCase();
}

// Sınavları filtrele
function filterExams(filterType) {
    currentFilter = filterType;

    // Filter butonlarını güncelle
    document.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.dataset.filter === filterType) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Listeyi güncelle
    updateSavedExams();
}

// Verileri dışa aktar (JSON)
function exportData() {
    if (examResults.length === 0) {
        showErrorMessage('Dışa aktarılacak veri bulunamadı!');
        return;
    }

    try {
        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            examCount: examResults.length,
            exams: examResults
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `sinav-takip-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showSuccessMessage(`Toplam ${examResults.length} sınav başarıyla dışa aktarıldı!`);
    } catch (error) {
        showErrorMessage('Veri dışa aktarma hatası: ' + error.message);
    }
}

// Verileri içe aktar (JSON)
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
        showErrorMessage('Lütfen geçerli bir JSON dosyası seçin!');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const importedData = JSON.parse(e.target.result);

            // Veri formatını kontrol et
            let examsToImport = [];
            if (Array.isArray(importedData)) {
                // Eski format (sadece array)
                examsToImport = importedData;
            } else if (importedData.exams && Array.isArray(importedData.exams)) {
                // Yeni format (object içinde exams)
                examsToImport = importedData.exams;
            } else {
                throw new Error('Geçersiz veri formatı');
            }

            if (examsToImport.length === 0) {
                showErrorMessage('İçe aktarılacak sınav bulunamadı!');
                return;
            }

            // Onay al
            const confirmMsg = `Toplam ${examsToImport.length} sınav içe aktarılacak. Mevcut veriler silinsin mi? (Hayır derseniz ekleme yapılacak)`;
            const replace = confirm(confirmMsg);

            if (replace) {
                examResults = examsToImport;
            } else {
                // Mevcut ID'leri al
                const existingIds = new Set(examResults.map(e => e.id));
                // Yeni ID'ler atayarak ekle
                examsToImport.forEach(exam => {
                    if (!existingIds.has(exam.id)) {
                        exam.id = Date.now() + Math.random();
                        examResults.push(exam);
                    }
                });
            }

            saveToLocalStorage();
            updateDisplay();
            showSuccessMessage(`${examResults.length} sınav başarıyla yüklendi!`);
        } catch (error) {
            showErrorMessage('Veri içe aktarma hatası: ' + error.message);
        }
    };

    reader.onerror = function () {
        showErrorMessage('Dosya okuma hatası!');
    };

    reader.readAsText(file);

    // Input'u temizle
    event.target.value = '';
}

// Tüm verileri temizle
function clearAllData() {
    if (examResults.length === 0) {
        showInfoMessage('Temizlenecek veri bulunamadı!');
        return;
    }

    const confirmMsg = `TÜM ${examResults.length} SINAV SONUCU SİLİNECEK!\n\nBu işlem geri alınamaz. Emin misiniz?`;
    if (!confirm(confirmMsg)) {
        return;
    }

    // İkinci onay
    if (!confirm('Son bir kez daha onaylıyor musunuz?')) {
        return;
    }

    try {
        examResults = [];
        localStorage.removeItem('examResults');
        localStorage.removeItem('examResultsBackup');
        updateDisplay();
        showSuccessMessage('Tüm veriler başarıyla temizlendi!');
    } catch (error) {
        showErrorMessage('Veri temizleme hatası: ' + error.message);
    }
}

// Sınav karşılaştırma modalı
function showCompareModal() {
    if (examResults.length < 2) {
        showErrorMessage('Karşılaştırma için en az 2 sınav gereklidir!');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'exam-detail-modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 1000px;">
            <div class="modal-header">
                <h3>📊 Sınav Karşılaştırma</h3>
                <button class="close-btn">✕</button>
            </div>
            <div class="modal-body">
                <div class="compare-selector">
                    <div class="form-group">
                        <label for="compareExam1">Birinci Sınav:</label>
                        <select id="compareExam1" class="form-control">
                            ${examResults.map((exam, idx) =>
        `<option value="${idx}">${exam.name} (${exam.type.toUpperCase()}) - ${new Date(exam.date).toLocaleDateString('tr-TR')}</option>`
    ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="compareExam2">İkinci Sınav:</label>
                        <select id="compareExam2" class="form-control">
                            ${examResults.map((exam, idx) =>
        `<option value="${idx}" ${idx === 1 ? 'selected' : ''}>${exam.name} (${exam.type.toUpperCase()}) - ${new Date(exam.date).toLocaleDateString('tr-TR')}</option>`
    ).join('')}
                        </select>
                    </div>
                    <button id="compareBtn" class="btn-submit" style="margin-top: 20px;">Karşılaştır</button>
                </div>
                <div id="comparisonResult" class="comparison-result" style="margin-top: 30px; display: none;"></div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => modal.remove());

    modal.addEventListener('click', function (e) {
        if (e.target === modal) modal.remove();
    });

    // Modal elementlerini al
    const compareBtn = modal.querySelector('#compareBtn');
    const resultDiv = modal.querySelector('#comparisonResult');
    const exam1Select = modal.querySelector('#compareExam1');
    const exam2Select = modal.querySelector('#compareExam2');

    // Karşılaştırma fonksiyonu - modal içinde tanımla
    function performComparison() {
        const idx1 = parseInt(document.getElementById('compareExam1').value);
        const idx2 = parseInt(document.getElementById('compareExam2').value);

        if (idx1 === idx2) {
            showWarningMessage('Aynı sınav seçilemez!');
            return;
        }

        const exam1 = examResults[idx1];
        const exam2 = examResults[idx2];

        if (!exam1 || !exam2) {
            showErrorMessage('Sınav bulunamadı!');
            return;
        }

        // Sadece aynı tür sınavları karşılaştır
        if (exam1.type !== exam2.type) {
            showWarningMessage('Farklı tür sınavlar karşılaştırılamaz! (HMGS ve Hakimlik/Savcılık)');
            return;
        }

        const resultDiv = document.getElementById('comparisonResult');
        resultDiv.style.display = 'block';

        // Genel karşılaştırma
        const netDiff = (exam2.totalNet || 0) - (exam1.totalNet || 0);
        const scoreDiff = (exam2.totalScore || 0) - (exam1.totalScore || 0);
        const netDiffPercent = exam1.totalNet > 0 ? ((netDiff / exam1.totalNet) * 100).toFixed(1) : 0;

        let comparisonHTML = `
            <div class="compare-summary">
                <h4>Genel Karşılaştırma</h4>
                <div class="compare-grid">
                    <div class="compare-item">
                        <div class="compare-label">Sınav 1</div>
                        <div class="compare-value">${exam1.name}</div>
                        <div class="compare-date">${new Date(exam1.date).toLocaleDateString('tr-TR')}</div>
                    </div>
                    <div class="compare-item">
                        <div class="compare-label">Sınav 2</div>
                        <div class="compare-value">${exam2.name}</div>
                        <div class="compare-date">${new Date(exam2.date).toLocaleDateString('tr-TR')}</div>
                    </div>
                </div>
                <div class="compare-stats">
                    <div class="stat-row">
                        <span>Net:</span>
                        <strong>${(exam1.totalNet || 0).toFixed(2)} → ${(exam2.totalNet || 0).toFixed(2)}</strong>
                        <span class="${netDiff >= 0 ? 'positive' : 'negative'}">${netDiff >= 0 ? '+' : ''}${netDiff.toFixed(2)} (${netDiffPercent}%)</span>
                    </div>
                    <div class="stat-row">
                        <span>Başarı:</span>
                        <strong>%${exam1.totalScore || 0} → %${exam2.totalScore || 0}</strong>
                        <span class="${scoreDiff >= 0 ? 'positive' : 'negative'}">${scoreDiff >= 0 ? '+' : ''}${scoreDiff}%</span>
                    </div>
                    <div class="stat-row">
                        <span>Doğru:</span>
                        <strong>${exam1.totalCorrect || 0} → ${exam2.totalCorrect || 0}</strong>
                        <span class="${(exam2.totalCorrect - exam1.totalCorrect) >= 0 ? 'positive' : 'negative'}">${(exam2.totalCorrect - exam1.totalCorrect) >= 0 ? '+' : ''}${(exam2.totalCorrect || 0) - (exam1.totalCorrect || 0)}</span>
                    </div>
                    <div class="stat-row">
                        <span>Yanlış:</span>
                        <strong>${exam1.totalWrong || 0} → ${exam2.totalWrong || 0}</strong>
                        <span class="${(exam2.totalWrong - exam1.totalWrong) <= 0 ? 'positive' : 'negative'}">${(exam2.totalWrong - exam1.totalWrong) <= 0 ? '' : '+'}${(exam2.totalWrong || 0) - (exam1.totalWrong || 0)}</span>
                    </div>
                </div>
            </div>
        `;

        // Ders bazında karşılaştırma (sadece Hakimlik/Savcılık için)
        if (!exam1.isHMGS && !exam2.isHMGS && exam1.subjects && exam2.subjects) {
            const subjects1 = Object.keys(exam1.subjects || {});
            const subjects2 = Object.keys(exam2.subjects || {});
            const allSubjects = [...new Set([...subjects1, ...subjects2])];

            comparisonHTML += `
            <div class="compare-subjects">
                <h4>Ders Bazında Karşılaştırma</h4>
                <div class="subject-comparison-table">
            `;

            allSubjects.forEach(subjectName => {
                const sub1 = exam1.subjects[subjectName];
                const sub2 = exam2.subjects[subjectName];

                if (sub1 && sub2) {
                    const netDiff = (sub2.net || 0) - (sub1.net || 0);
                    const score1 = sub1.questionCount > 0 ? ((sub1.net || 0) / sub1.questionCount * 100).toFixed(0) : 0;
                    const score2 = sub2.questionCount > 0 ? ((sub2.net || 0) / sub2.questionCount * 100).toFixed(0) : 0;

                    comparisonHTML += `
                        <div class="subject-compare-row">
                            <div class="subject-compare-name">${subjectName}</div>
                            <div class="subject-compare-values">
                                <span>Net: ${(sub1.net || 0).toFixed(2)} → ${(sub2.net || 0).toFixed(2)}</span>
                                <span class="${netDiff >= 0 ? 'positive' : 'negative'}">${netDiff >= 0 ? '+' : ''}${netDiff.toFixed(2)}</span>
                            </div>
                            <div class="subject-compare-scores">
                                <span>Başarı: %${score1} → %${score2}</span>
                            </div>
                        </div>
                    `;
                }
            });

            comparisonHTML += `
                </div>
            </div>
            `;
        }

        resultDiv.innerHTML = comparisonHTML;

        // Scroll to result
        setTimeout(() => {
            resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }

    // Karşılaştır butonuna event listener ekle
    compareBtn.addEventListener('click', performComparison);

    // İlk karşılaştırmayı yap
    performComparison();
}