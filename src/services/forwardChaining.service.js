/**
 * Forward Chaining Engine untuk Deteksi Speech Delay
 */

const KNOWLEDGE_BASE = {
  infant: [
    { id: 'inf_r001', name: 'Belum kata pertama usia 18+ bulan', antecedents: [{ key: 'first_word', value: ['Belum', 'Tidak yakin'] }, { key: 'ageInMonths', operator: '>=', value: 18 }], conclusion: 'belum_kata_pertama', confidence: 0.95, severity: 2, recommendation: 'Usia 18+ bulan seharusnya sudah bisa mengucapkan kata pertama' },
    { id: 'inf_r002', name: 'Belum kata pertama usia 24+ bulan (HIGH risk)', antecedents: [{ key: 'first_word', value: ['Belum', 'Tidak yakin'] }, { key: 'ageInMonths', operator: '>=', value: 24 }], conclusion: 'speech_delay_confirmed', confidence: 0.95, severity: 3, recommendation: 'Keterlambatan bicara confirmed - segera konsultasikan dengan terapis' },
    { id: 'inf_r003', name: 'Vocabulary sangat terbatas usia 18+ bulan', antecedents: [{ key: 'vocabulary_count', value: ['Kurang dari 10', '0 kata', '1-3 kata'] }, { key: 'ageInMonths', operator: '>=', value: 18 }], conclusion: 'vocabulary_terbatas', confidence: 0.9, severity: 2, recommendation: 'Kosakata sangat terbatas untuk usianya' },
    { id: 'inf_r004', name: 'Tidak meniru suara sama sekali', antecedents: [{ key: 'imitate_sounds', value: ['Tidak pernah', 'Jarang'] }], ageRange: [12, 24], conclusion: 'perkembangan_delayed', confidence: 0.85, severity: 2, recommendation: 'Kemampuan meniru suara perlu stimulasi tambahan' },
    { id: 'inf_r005', name: 'Respon nama buruk usia 12+ bulan', antecedents: [{ key: 'name_response', value: ['Jarang', 'Tidak pernah'] }, { key: 'ageInMonths', operator: '>=', value: 12 }], conclusion: 'respon_pendengaran_delayed', confidence: 0.9, severity: 3, recommendation: 'Perlu periksa pendengaran - kemungkinan masalah pendengaran' }
  ],
  toddler: [
    { id: 'todd_r001', name: 'Belum kalimat 2 kata usia 24+ bulan', antecedents: [{ key: 'two_word_phrase', value: ['Belum'] }, { key: 'ageInMonths', operator: '>=', value: 24 }], conclusion: 'belum_kalimat_sederhana', confidence: 0.9, severity: 2, recommendation: 'Seharusnya sudah bisa membuat kalimat 2 kata' },
    { id: 'todd_r002', name: 'Speech clarity sangat buruk', antecedents: [{ key: 'speech_clarity', value: ['Jarang', 'Tidak pernah'] }], ageRange: [18, 999], conclusion: 'artikulasi_delayed', confidence: 0.9, severity: 2, recommendation: 'Artikulasi perlu perhatian khusus - konsultasikan dengan terapis' },
    { id: 'todd_r003', name: 'Tidak bisa ikuti perintah sederhana', antecedents: [{ key: 'follow_commands', value: ['Belum'] }], ageRange: [18, 36], conclusion: 'perkembangan_delayed', confidence: 0.85, severity: 2, recommendation: 'Kemampuan memahami perlu evaluasi lebih lanjut' },
    { id: 'todd_r004', name: 'Vocabulary sangat kurang untuk usia', antecedents: [{ key: 'vocabulary_count', value: ['Kurang dari 10'] }, { key: 'ageInMonths', operator: '>=', value: 24 }], conclusion: 'speech_delay_confirmed', confidence: 0.95, severity: 3, recommendation: 'Speech delay confirmed - vocabulary sangat terbatas' },
    { id: 'todd_r005', name: 'Respon nama buruk usia 18+ bulan', antecedents: [{ key: 'name_response', value: ['Jarang', 'Tidak pernah'] }, { key: 'ageInMonths', operator: '>=', value: 18 }], conclusion: 'respon_pendengaran_delayed', confidence: 0.95, severity: 3, recommendation: 'HIGH RISK: Kemungkinan masalah pendengaran' },
    { id: 'todd_r006', name: 'Kekhawatiran orang tua tentang speech', antecedents: [{ key: 'parent_concern', value: ['Ya'] }], conclusion: 'perlu_monitoring', confidence: 0.8, severity: 1, recommendation: 'Kekhawatiran orang tua perlu diperhatikan' }
  ],
  preschool: [
    { id: 'pres_r001', name: 'Vocabulary sangat kurang untuk usia 3-5 tahun', antecedents: [{ key: 'vocabulary_count', value: ['Kurang dari 50'] }, { key: 'ageInMonths', operator: '>=', value: 36 }], conclusion: 'vocabulary_terbatas', confidence: 0.9, severity: 2, recommendation: 'Vocabulary terbatas untuk usia prasekolah' },
    { id: 'pres_r002', name: 'Belum bisa kalimat 3-4 kata usia 4+ tahun', antecedents: [{ key: 'sentence_structure', value: ['Belum', 'Masih Belajar'] }, { key: 'ageInMonths', operator: '>=', value: 48 }], conclusion: 'speech_delay_confirmed', confidence: 0.9, severity: 3, recommendation: 'Keterlambatan speech confirmed - perlu intervensi segera' },
    { id: 'pres_r003', name: 'Tidak bisa narasikan pengalaman', antecedents: [{ key: 'narrative_skill', value: ['Belum'] }, { key: 'ageInMonths', operator: '>=', value: 36 }], conclusion: 'perkembangan_delayed', confidence: 0.85, severity: 2, recommendation: 'Kemampuan narasi perlu stimulasi intensif' },
    { id: 'pres_r004', name: 'Speech clarity sangat buruk di usia prasekolah', antecedents: [{ key: 'speech_clarity', value: ['Jarang', 'Tidak pernah'] }, { key: 'ageInMonths', operator: '>=', value: 36 }], conclusion: 'gangguan_artikulasi', confidence: 0.9, severity: 3, recommendation: 'HIGH RISK: Gangguan artikulasi - segera terapi' },
    { id: 'pres_r005', name: 'Kesulitan artikulasi signifikan', antecedents: [{ key: 'articulation_difficulty', value: ['Banyak', 'Sangat banyak'] }, { key: 'ageInMonths', operator: '>=', value: 36 }], conclusion: 'gangguan_artikulasi', confidence: 0.95, severity: 3, recommendation: 'Gangguan artikulasi parah - segera konsultasikan' },
    { id: 'pres_r006', name: 'Tidak bisa jawab pertanyaan sederhana', antecedents: [{ key: 'answer_questions', value: ['Belum', 'Kadang-kadang'] }, { key: 'ageInMonths', operator: '>=', value: 36 }], conclusion: 'perkembangan_delayed', confidence: 0.85, severity: 2, recommendation: 'Pemahaman bahasa perlu stimulasi lebih' },
    { id: 'pres_r007', name: 'Masalah sosial - sulit bergaul', antecedents: [{ key: 'social_interaction', value: ['Sulit', 'Prefer sendiri'] }, { key: 'ageInMonths', operator: '>=', value: 36 }], conclusion: 'perlu_evaluasi_sosial', confidence: 0.8, severity: 2, recommendation: 'Masalah interaksi sosial perlu perhatian' }
  ],
  universal: [
    { id: 'univ_r001', name: 'Riwayat keluarga speech delay', antecedents: [{ key: 'family_history', value: ['Ya'] }], conclusion: 'faktor_risiko_genetik', confidence: 0.8, severity: 1, recommendation: 'Faktor genetik meningkatkan risiko speech delay' },
    { id: 'univ_r002', name: 'Riwayat masalah pendengaran', antecedents: [{ key: 'hearing_issues', value: ['Ya'] }], conclusion: 'respon_pendengaran_delayed', confidence: 0.95, severity: 3, recommendation: 'Riwayat pendengaran - prioritas tinggi untuk evaluasi THT' },
    { id: 'univ_r003', name: 'Multiple delay indicators', antecedents: [{ key: 'belum_kata_pertama', value: ['true'] }, { key: 'vocabulary_terbatas', value: ['true'] }], conclusion: 'speech_delay_confirmed', confidence: 0.95, severity: 3, recommendation: 'Multiple delay indicators - speech delay confirmed' },
    { id: 'univ_r004', name: 'Respon pendengaran + artikulasi delay', antecedents: [{ key: 'respon_pendengaran_delayed', value: ['true'] }, { key: 'artikulasi_delayed', value: ['true'] }], conclusion: 'speech_delay_confirmed', confidence: 0.95, severity: 3, recommendation: 'Speech delay dengan masalah pendengaran - prioritas tinggi' },
    { id: 'univ_r005', name: 'Positive development indicators', antecedents: [{ key: 'first_word', value: ['Ya'] }, { key: 'vocabulary_count', value: ['50-100 kata', '100-200 kata', '200-500 kata', 'Lebih dari 100', 'Lebih dari 500'] }, { key: 'speech_clarity', value: ['Selalu', 'Ya, dengan baik'] }], conclusion: 'perkembangan_normal', confidence: 0.85, severity: 0, recommendation: 'Indikator perkembangan positif' }
  ]
};

const DELAY_INDICATORS = ['belum_kata_pertama', 'vocabulary_terbatas', 'belum_kalimat_sederhana', 'artikulasi_delayed', 'respon_pendengaran_delayed', 'speech_delay_confirmed', 'perkembangan_delayed', 'gangguan_artikulasi'];

class ForwardChainingEngine {
  constructor() {
    this.rules = [...KNOWLEDGE_BASE.infant, ...KNOWLEDGE_BASE.toddler, ...KNOWLEDGE_BASE.preschool, ...KNOWLEDGE_BASE.universal];
  }

  getRulesForAge(ageInMonths) {
    return this.rules.filter(rule => {
      if (rule.ageRange) return ageInMonths >= rule.ageRange[0] && ageInMonths <= rule.ageRange[1];
      return true;
    });
  }

  _checkAntecedents(rule, workingMemory, ageInMonths) {
    for (const antecedent of rule.antecedents) {
      if (antecedent.key === 'ageInMonths') {
        const actualAge = workingMemory.ageInMonths || ageInMonths;
        if (antecedent.operator === '>=') { if (!(actualAge >= antecedent.value)) return false; }
        else if (antecedent.operator === '>') { if (!(actualAge > antecedent.value)) return false; }
        continue;
      }
      const actualValue = workingMemory[antecedent.key];
      if (actualValue === undefined) return false;
      if (Array.isArray(antecedent.value)) { if (!antecedent.value.includes(actualValue)) return false; }
      else { if (actualValue !== antecedent.value) return false; }
    }
    return true;
  }

  infer(answers, ageInMonths) {
    const workingMemory = { ...answers, ageInMonths };
    const derivedFacts = new Set();
    const triggeredRules = [];
    const categoryFindings = {};

    let newFactsFound;
    do {
      newFactsFound = false;
      const applicableRules = this.getRulesForAge(workingMemory.ageInMonths || ageInMonths);
      for (const rule of applicableRules) {
        if (triggeredRules.includes(rule.id)) continue;
        if (this._checkAntecedents(rule, workingMemory, ageInMonths)) {
          if (!workingMemory[rule.conclusion]) {
            workingMemory[rule.conclusion] = 'true';
            derivedFacts.add(rule.conclusion);
            triggeredRules.push(rule.id);
            const category = this._getCategoryFromConclusion(rule.conclusion);
            if (!categoryFindings[category]) categoryFindings[category] = [];
            categoryFindings[category].push(rule.name);
            newFactsFound = true;
          }
        }
      }
    } while (newFactsFound);

    return this._calculateResults(workingMemory, derivedFacts, triggeredRules, categoryFindings, ageInMonths);
  }

  _getCategoryFromConclusion(conclusion) {
    if (conclusion.includes('vocabulary')) return 'vocabulary';
    if (conclusion.includes('artikulasi')) return 'articulation';
    if (conclusion.includes('respon') || conclusion.includes('pendengaran')) return 'response';
    if (conclusion.includes('kalimat') || conclusion.includes('sentence')) return 'speech';
    if (conclusion.includes('normal')) return 'development';
    if (conclusion.includes('social')) return 'social';
    return 'general';
  }

  _calculateResults(workingMemory, derivedFacts, triggeredRules, categoryFindings, ageInMonths) {
    let delayCount = 0;
    for (const indicator of DELAY_INDICATORS) { if (derivedFacts.has(indicator)) delayCount++; }

    let maxSeverity = 0, scoreAccumulator = 0, maxPossibleScore = 0;
    for (const ruleId of triggeredRules) {
      const rule = this.rules.find(r => r.id === ruleId);
      if (rule) { 
        if (rule.severity > maxSeverity) maxSeverity = rule.severity; 
        
        scoreAccumulator += rule.confidence * rule.severity;
        maxPossibleScore += 1.0 * 3; // max confidence = 1.0, max severity = 3
      }
    }

    const normalizedScore = maxPossibleScore > 0 ? (scoreAccumulator / maxPossibleScore) : 0.0;
    const score = Math.round(normalizedScore * 100);
    let riskLevel, confidence;
    if (delayCount >= 3 || maxSeverity >= 3) { riskLevel = 'HIGH'; confidence = 0.9; }
    else if (delayCount >= 1 || maxSeverity >= 2) { riskLevel = 'MEDIUM'; confidence = 0.7; }
    else { riskLevel = 'LOW'; confidence = 0.95; }

    const recommendations = this._generateRecommendations(derivedFacts, ageInMonths, riskLevel, triggeredRules);
    const ageCategory = this._getAgeCategory(ageInMonths);

    return { riskLevel, confidence, score, derivedFacts: Array.from(derivedFacts), triggeredRules, categoryFindings, recommendations, ageInMonths, ageCategory, summary: { totalRules: this.rules.length, triggeredCount: triggeredRules.length, delayIndicators: delayCount, maxSeverity, ageCategory } };
  }

  _generateRecommendations(derivedFacts, ageInMonths, riskLevel, triggeredRules) {
    const recommendations = [];

    // Add specific rule recommendations first
    if (triggeredRules && triggeredRules.length > 0) {
      for (const ruleId of triggeredRules) {
        const rule = this.rules.find(r => r.id === ruleId);
        if (rule && rule.recommendation && !recommendations.includes(rule.recommendation)) {
          recommendations.push(rule.recommendation);
        }
      }
    }

    if (riskLevel === 'HIGH') {
      recommendations.push('Disarankan segera berkonsultasi dengan terapis wicara');
      recommendations.push('Lakukan evaluasi pendengaran untuk memastikan fungsi pendengaran');
      recommendations.push('Mulai program terapi wicara secepat mungkin');
      if (derivedFacts.has('respon_pendengaran_delayed')) recommendations.push('Segera lakukan periksa pendengaran dengan THT');
      if (derivedFacts.has('gangguan_artikulasi')) recommendations.push('Fokus pada latihan artikulasi dengan terapis');
    } else if (riskLevel === 'MEDIUM') {
      recommendations.push('Disarankan melakukan monitoring perkembangan secara rutin');
      recommendations.push('Lakukan stimulasi speech di rumah secara konsisten');
      recommendations.push('Konsultasi dengan terapis wicara untuk penilaian lebih lanjut');
      if (ageInMonths < 24) recommendations.push('Fokus pada stimulasi bicara dengan meniru suara');
    } else {
      recommendations.push('Perkembangan speech anak terlihat normal');
      recommendations.push('Lanjutkan stimulasi di rumah dengan aktivitas bicara sehari-hari');
      recommendations.push('Lakukan evaluasi berkala setiap 6 bulan');
    }
    recommendations.push('Buat lingkungan yang kaya stimulasi bicara di rumah');
    return recommendations;
  }

  _getAgeCategory(ageInMonths) {
    if (ageInMonths < 18) return 'Infant (Bayi)';
    else if (ageInMonths < 36) return 'Toddler (Batita)';
    else if (ageInMonths < 60) return 'Preschool (Prasekolah)';
    else return 'Preschool+ (Prasekolah+)';
  }
}

module.exports = { ForwardChainingEngine, KNOWLEDGE_BASE, DELAY_INDICATORS };