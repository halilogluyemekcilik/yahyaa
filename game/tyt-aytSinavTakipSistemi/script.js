// TYT dersleri ve soru sayıları (Sosyal ve Fen dersleri gruplandırılmıştır)
const TYT_SUBJECTS = [
    { name: 'Türkçe', questionCount: 40 },
    { name: 'Tarih', questionCount: 5 },
    { name: 'Coğrafya', questionCount: 5 },
    { name: 'Felsefe', questionCount: 5 },
    { name: 'Din/Ek Felsefe', questionCount: 5 },
    { name: 'Matematik', questionCount: 40 },
    { name: 'Fizik', questionCount: 7 },
    { name: 'Kimya', questionCount: 7 },
    { name: 'Biyoloji', questionCount: 6 }
];

// AYT dersleri ve soru sayıları
const AYT_SUBJECTS = [
    { name: 'Türk Dili ve Edebiyatı', questionCount: 24 },
    { name: 'Tarih-1', questionCount: 10 },
    { name: 'Coğrafya-1', questionCount: 6 },
    { name: 'Tarih-2', questionCount: 11 },
    { name: 'Coğrafya-2', questionCount: 11 },
    { name: 'Felsefe Grubu', questionCount: 12 },
    { name: 'Din Kültürü', questionCount: 6 },
    { name: 'Matematik', questionCount: 40 },
    { name: 'Fizik', questionCount: 14 },
    { name: 'Kimya', questionCount: 13 },
    { name: 'Biyoloji', questionCount: 13 }
];

// Sınav sonuçlarını localStorage'da saklayacağız
let examResults = JSON.parse(localStorage.getItem('examResults')) || [];
let currentExam = null;
let activeSubjects = TYT_SUBJECTS; // Başlangıçta TYT varsayılan olsun
let netChart, subjectChart; // Grafik nesneleri

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
document.addEventListener('DOMContentLoaded', function() {
    updateTotalQuestions();
    createExamTable();
    updateDisplay();
    setDefaultDate();
});

// Sınav türü değiştiğinde ders tablosunu ve toplam soru sayısını güncelle
examTypeSelect.addEventListener('change', function() {
    const selectedType = this.value;
    activeSubjects = selectedType === 'tyt' ? TYT_SUBJECTS : AYT_SUBJECTS;
    
    updateTotalQuestions();
    createExamTable();
    updateTotals(); // Yeni ders tablosu için total değerlerini sıfırla
    renderCharts(selectedType); // Seçilen türe göre grafikleri yeniden çiz
});

// Toplam soru sayısını güncelle
function updateTotalQuestions() {
    const newTotalQuestions = activeSubjects.reduce((sum, subject) => sum + subject.questionCount, 0);
    totalQuestionsInput.value = newTotalQuestions;
}

// Form gönderildiğinde yeni sınavı başlat
examForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const examName = document.getElementById('examName').value;
    const examDate = document.getElementById('examDate').value;
    const examType = document.getElementById('examType').value;
    const totalQuestions = parseInt(totalQuestionsInput.value) || 0;
    
    if (!examName || !examDate) {
        alert('Lütfen sınav adı ve tarihini girin!');
        return;
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
    
    activeSubjects.forEach(subject => {
        currentExam.subjects[subject.name] = {
            correct: 0,
            wrong: 0,
            questionCount: subject.questionCount
        };
    });
    
    currentExamName.textContent = examName;
    currentExamType.textContent = examType.toUpperCase();
    currentExamDate.textContent = new Date(examDate).toLocaleDateString('tr-TR');
    currentExamTotal.textContent = totalQuestions > 0 ? totalQuestions : 'Belirtilmemiş';
    currentExamDiv.style.display = 'block';
    
    examForm.style.display = 'none';
    
    // Sınav tablosunu görünür yap
    document.querySelector('.exam-table-container').style.display = 'block';
    
    updateExamTable();
    
    showSuccessMessage('Sınav başlatıldı! Şimdi her ders için doğru/yanlış sayılarını girebilirsiniz.');
});

// Sınav tablosunu oluştur
function createExamTable() {
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

// Toplamları güncelle
function updateTotals() {
    if (!currentExam) return;
    
    let totalCorrectCount = 0;
    let totalWrongCount = 0;
    let totalNetCount = 0;
    
    activeSubjects.forEach(subject => {
        const correctInput = document.querySelector(`input[data-subject="${subject.name}"].correct-input`);
        const wrongInput = document.querySelector(`input[data-subject="${subject.name}"].wrong-input`);
        
        if (correctInput && wrongInput) {
            const correct = parseInt(correctInput.value) || 0;
            const wrong = parseInt(wrongInput.value) || 0;

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
            
            if (netCell) netCell.textContent = Math.max(0, net).toFixed(2);
            if (scoreCell) scoreCell.textContent = `%${Math.max(0, score).toFixed(0)}`;

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
}

// Sınavı bitir ve kaydet
function finishExam() {
    if (!currentExam) return;
    
    const totalCorrectCount = parseInt(totalCorrect.textContent);
    const totalWrongCount = parseInt(totalWrong.textContent);
    const totalAnswered = totalCorrectCount + totalWrongCount;
    
    if (totalAnswered === 0) {
        alert('En az bir soru cevaplanmalı!');
        return;
    }
    
    currentExam.totalNet = parseFloat(totalNet.textContent);
    currentExam.totalCorrect = totalCorrectCount;
    currentExam.totalWrong = totalWrongCount;
    currentExam.totalScore = parseInt(totalScore.textContent.replace('%', ''));

    examResults.push(currentExam);
    saveToLocalStorage();
    
    showSuccessMessage('Sınav başarıyla kaydedildi!');
    
    examForm.reset();
    updateTotalQuestions();
    examForm.style.display = 'block';
    currentExamDiv.style.display = 'none';
    currentExam = null;
    
    // Tabloyu gizle
    document.querySelector('.exam-table-container').style.display = 'none';
    
    activeSubjects = TYT_SUBJECTS;
    createExamTable();
    updateDisplay();
    setDefaultDate();
}

// LocalStorage'a kaydet
function saveToLocalStorage() {
    localStorage.setItem('examResults', JSON.stringify(examResults));
}

// Ekranı güncelle
function updateDisplay() {
    updateStats();
    updateSavedExams();
    renderCharts(examTypeSelect.value); // Başlangıçta seçili olan türe göre grafik çiz
}

// İstatistikleri güncelle
function updateStats() {
    totalExams.textContent = examResults.length;
    
    if (examResults.length === 0) {
        averageScore.textContent = '%0';
        bestSubject.textContent = '-';
        return;
    }
    
    let totalNetSum = 0;
    let totalQuestionsSum = 0;
    let allSubjectScores = {};
    
    examResults.forEach(exam => {
        if (exam && exam.subjects && typeof exam.subjects === 'object') {
            totalNetSum += exam.totalNet || 0;
            totalQuestionsSum += exam.totalQuestions || 0;
            
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
        if (stats.count > 0 && stats.totalQuestions > 0) { // Sadece en az bir sınavda olan dersleri kontrol et
            const avg = Math.round((stats.totalNet / stats.totalQuestions) * 100);
            if (avg > bestSubjectAvg) {
                bestSubjectAvg = avg;
                bestSubjectName = subjectName;
            }
        }
    });
    
    bestSubject.textContent = bestSubjectName;
}

// Kaydedilen sınavları güncelle
function updateSavedExams() {
    if (examResults.length === 0) {
        savedExams.innerHTML = '<p style="text-align: center; color: #718096;">Henüz sınav kaydedilmemiş.</p>';
        return;
    }
    
    const sortedExams = examResults.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
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
    
    modal.addEventListener('click', function(e) {
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
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 300);
    }, 3000);
}

// Grafik oluşturma ve güncelleme fonksiyonu
function renderCharts(examType = 'tyt') {
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
    const examLabels = sortedExams.map(e => `${e.name} (${e.date})`);
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
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: `${examType.toUpperCase()} Toplam Net Gelişimi`,
                    font: { size: 16 }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
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
                        text: 'Net Sayısı'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Sınav Adı'
                    }
                }
            }
        }
    });

    // --- 2. Ders Bazlı Ortalama Başarı Grafiği (Çubuk Grafik) ---
    const subjectStats = {};
    const targetSubjects = examType === 'tyt' ? TYT_SUBJECTS : AYT_SUBJECTS;

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
            subjectLabels.push(subjectName);
            subjectScores.push(Math.max(0, avgScore));
        } else if (stats.totalExamCount > 0) {
             // Soru sayısı sıfır olan durumlar için, en azından boş bir değer ekle
             subjectLabels.push(subjectName);
             subjectScores.push(0);
        }
    });

    if (subjectChart) subjectChart.destroy();
    subjectChart = new Chart(subjectChartCtx, {
        type: 'bar',
        data: {
            labels: subjectLabels,
            datasets: [{
                label: 'Ortalama Başarı Yüzdesi (%)',
                data: subjectScores,
                backgroundColor: '#38a169',
                borderColor: '#2f855a',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: `${examType.toUpperCase()} Derslere Göre Ortalama Başarı`,
                    font: { size: 16 }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Başarı: %${context.raw.toFixed(1)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Başarı Yüzdesi (%)'
                    }
                }
            }
        }
    });
}

// Yardımcı fonksiyon: tüm ders listeleri arasında ders bilgisi bul
function findSubjectInfo(subjectName) {
    const allSubjects = [...TYT_SUBJECTS, ...AYT_SUBJECTS];
    return allSubjects.find(s => s.name === subjectName);
}