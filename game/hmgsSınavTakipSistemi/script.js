// Hukuk dersleri listesi ve her dersin soru sayısı
const LAW_SUBJECTS = [
    { name: 'Anayasa Hukuku', questionCount: 6 },
    { name: 'Anayasa Yargısı', questionCount: 3 },
    { name: 'İdare Hukuku', questionCount: 6 },
    { name: 'İdari Yargılama Usulü', questionCount: 3 },
    { name: 'Medeni Hukuk', questionCount: 15 },
    { name: 'Borçlar Hukuku', questionCount: 12 },
    { name: 'Ticaret Hukuku', questionCount: 12 },
    { name: 'Hukuk Yargılama Usulü', questionCount: 12 },
    { name: 'İcra ve İflas Hukuku', questionCount: 6 },
    { name: 'Ceza Hukuku', questionCount: 9 },
    { name: 'Ceza Yargılama Usulü', questionCount: 6 },
    { name: 'İş ve Sosyal Güvenlik', questionCount: 6 },
    { name: 'Vergi Hukuku', questionCount: 3 },
    { name: 'Vergi Usul Hukuku', questionCount: 3 },
    { name: 'Avukatlık Hukuku', questionCount: 3 },
    { name: 'Hukuk Felsefesi&Sosyolojisi', questionCount: 3 },
    { name: 'Türk Hukuk Tarihi', questionCount: 3 },
    { name: 'Milletlerarası Hukuk', questionCount: 3 },
    { name: 'Milletlerarası Özel Hukuk', questionCount: 3 },
    { name: 'Genel Kamu Hukuku', questionCount: 3 }
];

// Sınav sonuçlarını localStorage'da saklayacağız
let examResults = JSON.parse(localStorage.getItem('examResults')) || [];
let currentExam = null;

// DOM elementlerini seçelim
const examForm = document.getElementById('examForm');
const examTableBody = document.getElementById('examTableBody');
const totalCorrect = document.getElementById('totalCorrect');
const totalWrong = document.getElementById('totalWrong');
const totalScore = document.getElementById('totalScore');
const savedExams = document.getElementById('savedExams');
const totalExams = document.getElementById('totalExams');
const averageScore = document.getElementById('averageScore');
const bestSubject = document.getElementById('bestSubject');
const currentExamDiv = document.getElementById('currentExam');
const currentExamName = document.getElementById('currentExamName');
const currentExamDate = document.getElementById('currentExamDate');
const currentExamTotal = document.getElementById('currentExamTotal');

// Sayfa yüklendiğinde mevcut sonuçları göster
document.addEventListener('DOMContentLoaded', function() {
    createExamTable();
    updateDisplay();
    setDefaultDate();
    
    console.log('LocalStorage verileri:', examResults);
    console.log('Kaydedilen sınav sayısı:', examResults.length);
});

// Form gönderildiğinde yeni sınavı başlat
examForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const examName = document.getElementById('examName').value;
    const examDate = document.getElementById('examDate').value;
    const totalQuestions = parseInt(document.getElementById('totalQuestions').value) || 0;
    
    if (!examName || !examDate) {
        alert('Lütfen sınav adı ve tarihini girin!');
        return;
    }
    
    currentExam = {
        id: Date.now(),
        name: examName,
        date: examDate,
        totalQuestions: totalQuestions,
        subjects: {},
        timestamp: new Date().toISOString()
    };
    
    LAW_SUBJECTS.forEach(subject => {
        currentExam.subjects[subject.name] = {
            correct: 0,
            wrong: 0,
            questionCount: subject.questionCount
        };
    });
    
    currentExamName.textContent = examName;
    currentExamDate.textContent = new Date(examDate).toLocaleDateString('tr-TR');
    currentExamTotal.textContent = totalQuestions > 0 ? totalQuestions : 'Belirtilmemiş';
    currentExamDiv.style.display = 'block';
    
    examForm.style.display = 'none';
    
    updateExamTable();
    
    showSuccessMessage('Sınav başlatıldı! Şimdi her ders için doğru/yanlış sayılarını girebilirsiniz.');
});

// Sınav tablosunu oluştur
function createExamTable() {
    examTableBody.innerHTML = '';
    
    LAW_SUBJECTS.forEach(subject => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="subject-name">${subject.name} (${subject.questionCount})</td>
            <td>
                <input type="number" class="subject-input correct-input" 
                        data-subject="${subject.name}" min="0" max="${subject.questionCount}" value="0" 
                        onchange="updateTotals()" oninput="updateTotals()">
            </td>
            <td>
                <input type="number" class="subject-input wrong-input" 
                        data-subject="${subject.name}" min="0" max="${subject.questionCount}" value="0" 
                        onchange="updateTotals()" oninput="updateTotals()">
            </td>
            <td class="score-cell" id="score-${subject.name.replace(/\s+/g, '-')}">%0</td>
        `;
        examTableBody.appendChild(row);
    });
}

// Sınav tablosunu güncelle
function updateExamTable() {
    if (!currentExam) return;
    
    LAW_SUBJECTS.forEach(subject => {
        const correctInput = document.querySelector(`input[data-subject="${subject.name}"].correct-input`);
        const wrongInput = document.querySelector(`input[data-subject="${subject.name}"].wrong-input`);
        const scoreCell = document.getElementById(`score-${subject.name.replace(/\s+/g, '-')}`);
        
        if (correctInput && wrongInput && scoreCell) {
            correctInput.value = currentExam.subjects[subject.name].correct;
            wrongInput.value = currentExam.subjects[subject.name].wrong;
            
            const score = calculateSubjectScore(subject.name);
            scoreCell.textContent = `%${score}`;
        }
    });
    
    updateTotals();
}

// Ders özelinde başarı yüzdesi hesapla
function calculateSubjectScore(subjectName) {
    if (!currentExam || !currentExam.subjects[subjectName]) return 0;
    
    const subject = LAW_SUBJECTS.find(s => s.name === subjectName);
    if (!subject) return 0;
    
    const correct = currentExam.subjects[subjectName].correct;
    const questionCount = subject.questionCount;
    
    if (questionCount === 0) return 0;
    return Math.round((correct / questionCount) * 100);
}

// Toplamları güncelle
function updateTotals() {
    if (!currentExam) return;
    
    let totalCorrectCount = 0;
    let totalWrongCount = 0;
    
    LAW_SUBJECTS.forEach(subject => {
        const correctInput = document.querySelector(`input[data-subject="${subject.name}"].correct-input`);
        const wrongInput = document.querySelector(`input[data-subject="${subject.name}"].wrong-input`);
        
        if (correctInput && wrongInput) {
            const correct = parseInt(correctInput.value) || 0;
            const wrong = parseInt(wrongInput.value) || 0;
            
            currentExam.subjects[subject.name].correct = correct;
            currentExam.subjects[subject.name].wrong = wrong;
            
            totalCorrectCount += correct;
            totalWrongCount += wrong;
        }
    });
    
    totalCorrect.textContent = totalCorrectCount;
    totalWrong.textContent = totalWrongCount;
    
    const totalScorePercent = calculateTotalScore(totalCorrectCount);
    totalScore.textContent = `%${totalScorePercent}`;
    
    updateSubjectScores();
}

// Toplam başarı yüzdesi hesapla (100 puan üzerinden)
function calculateTotalScore(correctCount) {
    const totalQuestions = 120;
    if (totalQuestions === 0) return 0;
    
    return Math.round((correctCount / totalQuestions) * 100);
}

// Ders skorlarını güncelle
function updateSubjectScores() {
    LAW_SUBJECTS.forEach(subject => {
        const scoreCell = document.getElementById(`score-${subject.name.replace(/\s+/g, '-')}`);
        if (scoreCell) {
            const score = calculateSubjectScore(subject.name);
            scoreCell.textContent = `%${score}`;
        }
    });
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
    
    examResults.push(currentExam);
    saveToLocalStorage();
    
    showSuccessMessage('Sınav başarıyla kaydedildi!');
    
    examForm.reset();
    document.getElementById('totalQuestions').value = 120;
    examForm.style.display = 'block';
    currentExamDiv.style.display = 'none';
    currentExam = null;
    
    createExamTable();
    
    updateDisplay();
    setDefaultDate();
    
    updateSavedExams();
}

// LocalStorage'a kaydet
function saveToLocalStorage() {
    localStorage.setItem('examResults', JSON.stringify(examResults));
}

// Ekranı güncelle
function updateDisplay() {
    updateStats();
    updateSavedExams();
}

// İstatistikleri güncelle
function updateStats() {
    totalExams.textContent = examResults.length;
    
    if (examResults.length === 0) {
        averageScore.textContent = '%0';
        bestSubject.textContent = '-';
        return;
    }
    
    let totalScore = 0;
    let totalQuestions = 0;
    
    examResults.forEach(exam => {
        if (exam && exam.subjects && typeof exam.subjects === 'object') {
            let examCorrect = 0;
            let examWrong = 0;
            
            Object.values(exam.subjects).forEach(subject => {
                if (subject && typeof subject === 'object') {
                    examCorrect += subject.correct || 0;
                    examWrong += subject.wrong || 0;
                }
            });
            
            totalScore += examCorrect;
            totalQuestions += examCorrect + examWrong;
        }
    });
    
    const avgScore = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
    averageScore.textContent = `%${avgScore}`;
    
    const subjectScores = {};
    
    examResults.forEach(exam => {
        if (exam && exam.subjects && typeof exam.subjects === 'object') {
            Object.keys(exam.subjects).forEach(subjectName => {
                if (!subjectScores[subjectName]) {
                    subjectScores[subjectName] = { totalCorrect: 0, totalQuestions: 0 };
                }
                
                const subjectData = exam.subjects[subjectName];
                if (subjectData && typeof subjectData === 'object') {
                    const subjectInfo = LAW_SUBJECTS.find(s => s.name === subjectName);
                    
                    if (subjectInfo) {
                        subjectScores[subjectName].totalCorrect += subjectData.correct || 0;
                        subjectScores[subjectName].totalQuestions += subjectInfo.questionCount;
                    }
                }
            });
        }
    });
    
    let bestSubjectName = '-';
    let bestSubjectAvg = 0;
    
    Object.keys(subjectScores).forEach(subjectName => {
        const stats = subjectScores[subjectName];
        if (stats.totalQuestions > 0) {
            const avg = Math.round((stats.totalCorrect / stats.totalQuestions) * 100);
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
        
        let examCorrect = 0;
        let examWrong = 0;
        let totalQuestions = 0;
        
        LAW_SUBJECTS.forEach(subject => {
            if (exam.subjects[subject.name]) {
                const subjectData = exam.subjects[subject.name];
                if (subjectData && typeof subjectData === 'object') {
                    examCorrect += subjectData.correct || 0;
                    examWrong += subjectData.wrong || 0;
                    totalQuestions += subject.questionCount;
                }
            }
        });
        
        const score = Math.round((examCorrect / 120) * 100);
        const examDate = new Date(exam.date).toLocaleDateString('tr-TR');
        
        const examItem = document.createElement('div');
        examItem.className = 'exam-item';
        examItem.innerHTML = `
            <div class="exam-info">
                <div class="exam-subject">${exam.name}</div>
                <div class="exam-date">${examDate}</div>
                <div class="exam-details">
                    <span class="detail-item">Doğru: <strong>${examCorrect}</strong></span>
                    <span class="detail-item">Yanlış: <strong>${examWrong}</strong></span>
                    <span class="detail-item">Toplam Soru: <strong>${totalQuestions}</strong></span>
                </div>
                <div class="exam-scores">
                    <span class="score-item">Puan: <strong>${score}</strong></span>
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
    
    let examCorrect = 0;
    let examWrong = 0;
    let totalQuestions = 0;
    
    LAW_SUBJECTS.forEach(subject => {
        if (exam.subjects[subject.name]) {
            const subjectData = exam.subjects[subject.name];
            if (subjectData && typeof subjectData === 'object') {
                examCorrect += subjectData.correct || 0;
                examWrong += subjectData.wrong || 0;
                totalQuestions += subject.questionCount;
            }
        }
    });
    
    const score = Math.round((examCorrect / 120) * 100);
    const examDate = new Date(exam.date).toLocaleDateString('tr-TR');
    
    const modal = document.createElement('div');
    modal.className = 'exam-detail-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>📋 ${exam.name} - Sınav Detayları</h3>
                <button class="close-btn">✕</button>
            </div>
            <div class="modal-body">
                <div class="exam-summary">
                    <p><strong>Tarih:</strong> ${examDate}</p>
                    <p><strong>Toplam Puan:</strong> ${score}</p>
                    <p><strong>Genel Doğru:</strong> ${examCorrect}</p>
                    <p><strong>Genel Yanlış:</strong> ${examWrong}</p>
                </div>
                <div class="subject-details">
                    <h4>Ders Bazında Detaylar:</h4>
                    <div class="subject-list">
                        ${LAW_SUBJECTS.map(subject => {
                            const subjectData = exam.subjects[subject.name];
                            if (subjectData) {
                                const correct = subjectData.correct || 0;
                                const wrong = subjectData.wrong || 0;
                                const subjectScore = subject.questionCount > 0 ? Math.round((correct / subject.questionCount) * 100) : 0;
                                return `
                                    <div class="subject-detail-item">
                                        <div class="subject-name">${subject.name} (${subject.questionCount} soru)</div>
                                        <div class="subject-results">
                                            <span class="correct">Doğru: ${correct}</span>
                                            <span class="wrong">Yanlış: ${wrong}</span>
                                            <span class="score">Başarı: %${subjectScore}</span>
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
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #38a169;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
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

// CSS animasyonları ekle
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);