/**
 * Forward Chaining Engine untuk Deteksi Speech Delay
 */

const KNOWLEDGE_BASE = {
  infant: [
    {
      id: "infant_r020",
      name: "first_word - first_word_baik",
      antecedents: [
        {
          key: "first_word",
          value: [
            "Ya"
          ]
        }
      ],
      conclusion: "first_word_baik",
      confidence: 0.8,
      severity: 0,
      recommendation: "Perkembangan first_word menunjukkan hasil positif",
      ageRange: [
        10,
        18
      ]
    },
    {
      id: "infant_r021",
      name: "first_word - first_word_cukup",
      antecedents: [
        {
          key: "first_word",
          value: [
            "Tidak yakin"
          ]
        }
      ],
      conclusion: "first_word_cukup",
      confidence: 0.7,
      severity: 0,
      recommendation: "Perkembangan first_word dalam tahap belajar, berikan stimulasi",
      ageRange: [
        10,
        18
      ]
    },
    {
      id: "infant_r022",
      name: "first_word - first_word_kurang",
      antecedents: [
        {
          key: "first_word",
          value: [
            "Belum"
          ]
        }
      ],
      conclusion: "first_word_kurang",
      confidence: 0.9,
      severity: 2,
      recommendation: "Perkembangan first_word terlambat, segera konsultasikan",
      ageRange: [
        10,
        18
      ]
    },
    {
      id: "infant_r023",
      name: "imitate_sounds - imitate_sounds_baik",
      antecedents: [
        {
          key: "imitate_sounds",
          value: [
            "Sering"
          ]
        }
      ],
      conclusion: "imitate_sounds_baik",
      confidence: 0.8,
      severity: 0,
      recommendation: "Kemampuan imitate_sounds sangat baik dan sesuai usia",
      ageRange: [
        10,
        18
      ]
    },
    {
      id: "infant_r024",
      name: "imitate_sounds - imitate_sounds_cukup",
      antecedents: [
        {
          key: "imitate_sounds",
          value: [
            "Kadang-kadang"
          ]
        }
      ],
      conclusion: "imitate_sounds_cukup",
      confidence: 0.7,
      severity: 0,
      recommendation: "Kemampuan imitate_sounds cukup, terus berikan stimulasi",
      ageRange: [
        10,
        18
      ]
    },
    {
      id: "infant_r025",
      name: "imitate_sounds - imitate_sounds_kurang",
      antecedents: [
        {
          key: "imitate_sounds",
          value: [
            "Jarang",
            "Tidak pernah"
          ]
        }
      ],
      conclusion: "imitate_sounds_kurang",
      confidence: 0.85,
      severity: 2,
      recommendation: "Kemampuan imitate_sounds kurang, perlu perhatian khusus",
      ageRange: [
        10,
        18
      ]
    },
    {
      id: "infant_r026",
      name: "vocabulary_count - vocabulary_count_12_baik",
      antecedents: [
        {
          key: "vocabulary_count",
          value: [
            "2-3 kata",
            "Lebih dari 3"
          ]
        }
      ],
      conclusion: "vocabulary_count_12_baik",
      confidence: 0.8,
      severity: 0,
      recommendation: "Kemampuan vocabulary_count_12 sangat baik dan sesuai usia",
      ageRange: [
        10,
        18
      ]
    },
    {
      id: "infant_r027",
      name: "vocabulary_count - vocabulary_count_12_cukup",
      antecedents: [
        {
          key: "vocabulary_count",
          value: [
            "1 kata"
          ]
        }
      ],
      conclusion: "vocabulary_count_12_cukup",
      confidence: 0.7,
      severity: 0,
      recommendation: "Kemampuan vocabulary_count_12 cukup, terus berikan stimulasi",
      ageRange: [
        10,
        18
      ]
    },
    {
      id: "infant_r028",
      name: "vocabulary_count - vocabulary_count_12_kurang",
      antecedents: [
        {
          key: "vocabulary_count",
          value: [
            "0 kata"
          ]
        }
      ],
      conclusion: "vocabulary_count_12_kurang",
      confidence: 0.85,
      severity: 2,
      recommendation: "Kemampuan vocabulary_count_12 kurang, perlu perhatian khusus",
      ageRange: [
        10,
        18
      ]
    },
    {
      id: "infant_r029",
      name: "name_response - name_response_baik",
      antecedents: [
        {
          key: "name_response",
          value: [
            "Selalu"
          ]
        }
      ],
      conclusion: "name_response_baik",
      confidence: 0.8,
      severity: 0,
      recommendation: "Kemampuan name_response sangat baik dan sesuai usia",
      ageRange: [
        10,
        18
      ]
    },
    {
      id: "infant_r030",
      name: "name_response - name_response_cukup",
      antecedents: [
        {
          key: "name_response",
          value: [
            "Kadang-kadang"
          ]
        }
      ],
      conclusion: "name_response_cukup",
      confidence: 0.7,
      severity: 0,
      recommendation: "Kemampuan name_response cukup, terus berikan stimulasi",
      ageRange: [
        10,
        18
      ]
    },
    {
      id: "infant_r031",
      name: "name_response - name_response_kurang",
      antecedents: [
        {
          key: "name_response",
          value: [
            "Jarang",
            "Tidak pernah"
          ]
        }
      ],
      conclusion: "name_response_kurang",
      confidence: 0.85,
      severity: 2,
      recommendation: "Kemampuan name_response kurang, perlu perhatian khusus",
      ageRange: [
        10,
        18
      ]
    },
    {
      id: "infant_r032",
      name: "gesture_comm - gesture_comm_baik",
      antecedents: [
        {
          key: "gesture_comm",
          value: [
            "Ya, sering"
          ]
        }
      ],
      conclusion: "gesture_comm_baik",
      confidence: 0.8,
      severity: 0,
      recommendation: "Kemampuan gesture_comm sangat baik dan sesuai usia",
      ageRange: [
        10,
        18
      ]
    },
    {
      id: "infant_r033",
      name: "gesture_comm - gesture_comm_cukup",
      antecedents: [
        {
          key: "gesture_comm",
          value: [
            "Kadang-kadang"
          ]
        }
      ],
      conclusion: "gesture_comm_cukup",
      confidence: 0.7,
      severity: 0,
      recommendation: "Kemampuan gesture_comm cukup, terus berikan stimulasi",
      ageRange: [
        10,
        18
      ]
    },
    {
      id: "infant_r034",
      name: "gesture_comm - gesture_comm_kurang",
      antecedents: [
        {
          key: "gesture_comm",
          value: [
            "Jarang",
            "Tidak"
          ]
        }
      ],
      conclusion: "gesture_comm_kurang",
      confidence: 0.85,
      severity: 2,
      recommendation: "Kemampuan gesture_comm kurang, perlu perhatian khusus",
      ageRange: [
        10,
        18
      ]
    },
    {
      id: "infant_r035",
      name: "understand_simple - understand_simple_baik",
      antecedents: [
        {
          key: "understand_simple",
          value: [
            "Ya"
          ]
        }
      ],
      conclusion: "understand_simple_baik",
      confidence: 0.8,
      severity: 0,
      recommendation: "Perkembangan understand_simple menunjukkan hasil positif",
      ageRange: [
        10,
        18
      ]
    },
    {
      id: "infant_r036",
      name: "understand_simple - understand_simple_cukup",
      antecedents: [
        {
          key: "understand_simple",
          value: [
            "Kadang-kadang"
          ]
        }
      ],
      conclusion: "understand_simple_cukup",
      confidence: 0.7,
      severity: 0,
      recommendation: "Perkembangan understand_simple dalam tahap belajar, berikan stimulasi",
      ageRange: [
        10,
        18
      ]
    },
    {
      id: "infant_r037",
      name: "understand_simple - understand_simple_kurang",
      antecedents: [
        {
          key: "understand_simple",
          value: [
            "Belum"
          ]
        }
      ],
      conclusion: "understand_simple_kurang",
      confidence: 0.9,
      severity: 2,
      recommendation: "Perkembangan understand_simple terlambat, segera konsultasikan",
      ageRange: [
        10,
        18
      ]
    },
    {
      id: "infant_r038",
      name: "babbling - babbling_baik",
      antecedents: [
        {
          key: "babbling",
          value: [
            "Sering"
          ]
        }
      ],
      conclusion: "babbling_baik",
      confidence: 0.8,
      severity: 0,
      recommendation: "Kemampuan babbling sangat baik dan sesuai usia",
      ageRange: [
        10,
        18
      ]
    },
    {
      id: "infant_r039",
      name: "babbling - babbling_cukup",
      antecedents: [
        {
          key: "babbling",
          value: [
            "Kadang-kadang"
          ]
        }
      ],
      conclusion: "babbling_cukup",
      confidence: 0.7,
      severity: 0,
      recommendation: "Kemampuan babbling cukup, terus berikan stimulasi",
      ageRange: [
        10,
        18
      ]
    },
    {
      id: "infant_r040",
      name: "babbling - babbling_kurang",
      antecedents: [
        {
          key: "babbling",
          value: [
            "Jarang",
            "Tidak"
          ]
        }
      ],
      conclusion: "babbling_kurang",
      confidence: 0.85,
      severity: 2,
      recommendation: "Kemampuan babbling kurang, perlu perhatian khusus",
      ageRange: [
        10,
        18
      ]
    },
    {
      id: "infant_r041",
      name: "attention_sounds - attention_sounds_baik",
      antecedents: [
        {
          key: "attention_sounds",
          value: [
            "Ya, sering"
          ]
        }
      ],
      conclusion: "attention_sounds_baik",
      confidence: 0.8,
      severity: 0,
      recommendation: "Kemampuan attention_sounds sangat baik dan sesuai usia",
      ageRange: [
        10,
        18
      ]
    },
    {
      id: "infant_r042",
      name: "attention_sounds - attention_sounds_cukup",
      antecedents: [
        {
          key: "attention_sounds",
          value: [
            "Kadang-kadang"
          ]
        }
      ],
      conclusion: "attention_sounds_cukup",
      confidence: 0.7,
      severity: 0,
      recommendation: "Kemampuan attention_sounds cukup, terus berikan stimulasi",
      ageRange: [
        10,
        18
      ]
    },
    {
      id: "infant_r043",
      name: "attention_sounds - attention_sounds_kurang",
      antecedents: [
        {
          key: "attention_sounds",
          value: [
            "Jarang",
            "Tidak"
          ]
        }
      ],
      conclusion: "attention_sounds_kurang",
      confidence: 0.85,
      severity: 2,
      recommendation: "Kemampuan attention_sounds kurang, perlu perhatian khusus",
      ageRange: [
        10,
        18
      ]
    }
  ],
  toddler: [
    {
      id: "toddler_r044",
      name: "vocabulary_count - vocabulary_count_24_baik",
      antecedents: [
        {
          key: "vocabulary_count",
          value: [
            "25-50 kata",
            "Lebih dari 50"
          ]
        }
      ],
      conclusion: "vocabulary_count_24_baik",
      confidence: 0.8,
      severity: 0,
      recommendation: "Kemampuan vocabulary_count_24 sangat baik dan sesuai usia",
      ageRange: [
        18,
        32
      ]
    },
    {
      id: "toddler_r045",
      name: "vocabulary_count - vocabulary_count_24_cukup",
      antecedents: [
        {
          key: "vocabulary_count",
          value: [
            "10-25 kata"
          ]
        }
      ],
      conclusion: "vocabulary_count_24_cukup",
      confidence: 0.7,
      severity: 0,
      recommendation: "Kemampuan vocabulary_count_24 cukup, terus berikan stimulasi",
      ageRange: [
        18,
        32
      ]
    },
    {
      id: "toddler_r046",
      name: "vocabulary_count - vocabulary_count_24_kurang",
      antecedents: [
        {
          key: "vocabulary_count",
          value: [
            "Kurang dari 10"
          ]
        }
      ],
      conclusion: "vocabulary_count_24_kurang",
      confidence: 0.85,
      severity: 2,
      recommendation: "Kemampuan vocabulary_count_24 kurang, perlu perhatian khusus",
      ageRange: [
        18,
        32
      ]
    },
    {
      id: "toddler_r047",
      name: "two_word_phrase - two_word_phrase_baik",
      antecedents: [
        {
          key: "two_word_phrase",
          value: [
            "Ya"
          ]
        }
      ],
      conclusion: "two_word_phrase_baik",
      confidence: 0.8,
      severity: 0,
      recommendation: "Perkembangan two_word_phrase menunjukkan hasil positif",
      ageRange: [
        18,
        32
      ]
    },
    {
      id: "toddler_r048",
      name: "two_word_phrase - two_word_phrase_cukup",
      antecedents: [
        {
          key: "two_word_phrase",
          value: [
            "Kadang-kadang"
          ]
        }
      ],
      conclusion: "two_word_phrase_cukup",
      confidence: 0.7,
      severity: 0,
      recommendation: "Perkembangan two_word_phrase dalam tahap belajar, berikan stimulasi",
      ageRange: [
        18,
        32
      ]
    },
    {
      id: "toddler_r049",
      name: "two_word_phrase - two_word_phrase_kurang",
      antecedents: [
        {
          key: "two_word_phrase",
          value: [
            "Belum"
          ]
        }
      ],
      conclusion: "two_word_phrase_kurang",
      confidence: 0.9,
      severity: 2,
      recommendation: "Perkembangan two_word_phrase terlambat, segera konsultasikan",
      ageRange: [
        18,
        32
      ]
    },
    {
      id: "toddler_r050",
      name: "speech_clarity - speech_clarity_24_baik",
      antecedents: [
        {
          key: "speech_clarity",
          value: [
            "Selalu"
          ]
        }
      ],
      conclusion: "speech_clarity_24_baik",
      confidence: 0.8,
      severity: 0,
      recommendation: "Kemampuan speech_clarity_24 sangat baik dan sesuai usia",
      ageRange: [
        18,
        32
      ]
    },
    {
      id: "toddler_r051",
      name: "speech_clarity - speech_clarity_24_cukup",
      antecedents: [
        {
          key: "speech_clarity",
          value: [
            "Kadang-kadang"
          ]
        }
      ],
      conclusion: "speech_clarity_24_cukup",
      confidence: 0.7,
      severity: 0,
      recommendation: "Kemampuan speech_clarity_24 cukup, terus berikan stimulasi",
      ageRange: [
        18,
        32
      ]
    },
    {
      id: "toddler_r052",
      name: "speech_clarity - speech_clarity_24_kurang",
      antecedents: [
        {
          key: "speech_clarity",
          value: [
            "Jarang",
            "Tidak pernah"
          ]
        }
      ],
      conclusion: "speech_clarity_24_kurang",
      confidence: 0.85,
      severity: 2,
      recommendation: "Kemampuan speech_clarity_24 kurang, perlu perhatian khusus",
      ageRange: [
        18,
        32
      ]
    },
    {
      id: "toddler_r053",
      name: "asking_what - asking_what_baik",
      antecedents: [
        {
          key: "asking_what",
          value: [
            "Ya, sering"
          ]
        }
      ],
      conclusion: "asking_what_baik",
      confidence: 0.8,
      severity: 0,
      recommendation: "Kemampuan asking_what sangat baik dan sesuai usia",
      ageRange: [
        18,
        32
      ]
    },
    {
      id: "toddler_r054",
      name: "asking_what - asking_what_cukup",
      antecedents: [
        {
          key: "asking_what",
          value: [
            "Kadang-kadang"
          ]
        }
      ],
      conclusion: "asking_what_cukup",
      confidence: 0.7,
      severity: 0,
      recommendation: "Kemampuan asking_what cukup, terus berikan stimulasi",
      ageRange: [
        18,
        32
      ]
    },
    {
      id: "toddler_r055",
      name: "asking_what - asking_what_kurang",
      antecedents: [
        {
          key: "asking_what",
          value: [
            "Jarang",
            "Tidak"
          ]
        }
      ],
      conclusion: "asking_what_kurang",
      confidence: 0.85,
      severity: 2,
      recommendation: "Kemampuan asking_what kurang, perlu perhatian khusus",
      ageRange: [
        18,
        32
      ]
    },
    {
      id: "toddler_r056",
      name: "follow_commands_two - follow_commands_two_baik",
      antecedents: [
        {
          key: "follow_commands_two",
          value: [
            "Ya"
          ]
        }
      ],
      conclusion: "follow_commands_two_baik",
      confidence: 0.8,
      severity: 0,
      recommendation: "Perkembangan follow_commands_two menunjukkan hasil positif",
      ageRange: [
        18,
        32
      ]
    },
    {
      id: "toddler_r057",
      name: "follow_commands_two - follow_commands_two_cukup",
      antecedents: [
        {
          key: "follow_commands_two",
          value: [
            "Kadang-kadang"
          ]
        }
      ],
      conclusion: "follow_commands_two_cukup",
      confidence: 0.7,
      severity: 0,
      recommendation: "Perkembangan follow_commands_two dalam tahap belajar, berikan stimulasi",
      ageRange: [
        18,
        32
      ]
    },
    {
      id: "toddler_r058",
      name: "follow_commands_two - follow_commands_two_kurang",
      antecedents: [
        {
          key: "follow_commands_two",
          value: [
            "Belum"
          ]
        }
      ],
      conclusion: "follow_commands_two_kurang",
      confidence: 0.9,
      severity: 2,
      recommendation: "Perkembangan follow_commands_two terlambat, segera konsultasikan",
      ageRange: [
        18,
        32
      ]
    },
    {
      id: "toddler_r059",
      name: "point_body_parts - point_body_parts_baik",
      antecedents: [
        {
          key: "point_body_parts",
          value: [
            "Ya, semua"
          ]
        }
      ],
      conclusion: "point_body_parts_baik",
      confidence: 0.8,
      severity: 0,
      recommendation: "Kemampuan point_body_parts sangat baik dan sesuai usia",
      ageRange: [
        18,
        32
      ]
    },
    {
      id: "toddler_r060",
      name: "point_body_parts - point_body_parts_cukup",
      antecedents: [
        {
          key: "point_body_parts",
          value: [
            "Sebagian"
          ]
        }
      ],
      conclusion: "point_body_parts_cukup",
      confidence: 0.7,
      severity: 0,
      recommendation: "Kemampuan point_body_parts cukup, terus berikan stimulasi",
      ageRange: [
        18,
        32
      ]
    },
    {
      id: "toddler_r061",
      name: "point_body_parts - point_body_parts_kurang",
      antecedents: [
        {
          key: "point_body_parts",
          value: [
            "Sedikit",
            "Tidak"
          ]
        }
      ],
      conclusion: "point_body_parts_kurang",
      confidence: 0.85,
      severity: 2,
      recommendation: "Kemampuan point_body_parts kurang, perlu perhatian khusus",
      ageRange: [
        18,
        32
      ]
    },
    {
      id: "toddler_r062",
      name: "uses_i_me - uses_i_me_baik",
      antecedents: [
        {
          key: "uses_i_me",
          value: [
            "Ya, sering"
          ]
        }
      ],
      conclusion: "uses_i_me_baik",
      confidence: 0.8,
      severity: 0,
      recommendation: "Perkembangan uses_i_me menunjukkan hasil positif",
      ageRange: [
        18,
        32
      ]
    },
    {
      id: "toddler_r063",
      name: "uses_i_me - uses_i_me_cukup",
      antecedents: [
        {
          key: "uses_i_me",
          value: [
            "Kadang-kadang"
          ]
        }
      ],
      conclusion: "uses_i_me_cukup",
      confidence: 0.7,
      severity: 0,
      recommendation: "Perkembangan uses_i_me dalam tahap belajar, berikan stimulasi",
      ageRange: [
        18,
        32
      ]
    },
    {
      id: "toddler_r064",
      name: "uses_i_me - uses_i_me_kurang",
      antecedents: [
        {
          key: "uses_i_me",
          value: [
            "Belum"
          ]
        }
      ],
      conclusion: "uses_i_me_kurang",
      confidence: 0.9,
      severity: 2,
      recommendation: "Perkembangan uses_i_me terlambat, segera konsultasikan",
      ageRange: [
        18,
        32
      ]
    },
    {
      id: "toddler_r065",
      name: "enjoy_stories - enjoy_stories_baik",
      antecedents: [
        {
          key: "enjoy_stories",
          value: [
            "Sangat"
          ]
        }
      ],
      conclusion: "enjoy_stories_baik",
      confidence: 0.8,
      severity: 0,
      recommendation: "Kemampuan enjoy_stories sangat baik dan sesuai usia",
      ageRange: [
        18,
        32
      ]
    },
    {
      id: "toddler_r066",
      name: "enjoy_stories - enjoy_stories_cukup",
      antecedents: [
        {
          key: "enjoy_stories",
          value: [
            "Ya"
          ]
        }
      ],
      conclusion: "enjoy_stories_cukup",
      confidence: 0.7,
      severity: 0,
      recommendation: "Kemampuan enjoy_stories cukup, terus berikan stimulasi",
      ageRange: [
        18,
        32
      ]
    },
    {
      id: "toddler_r067",
      name: "enjoy_stories - enjoy_stories_kurang",
      antecedents: [
        {
          key: "enjoy_stories",
          value: [
            "Kadang-kadang",
            "Tidak"
          ]
        }
      ],
      conclusion: "enjoy_stories_kurang",
      confidence: 0.85,
      severity: 2,
      recommendation: "Kemampuan enjoy_stories kurang, perlu perhatian khusus",
      ageRange: [
        18,
        32
      ]
    }
  ],
  preschool: [
    {
      id: "preschool_r068",
      name: "vocabulary_count - vocabulary_count_36_baik",
      antecedents: [
        {
          key: "vocabulary_count",
          value: [
            "200-500 kata",
            "Lebih dari 500"
          ]
        }
      ],
      conclusion: "vocabulary_count_36_baik",
      confidence: 0.8,
      severity: 0,
      recommendation: "Kemampuan vocabulary_count_36 sangat baik dan sesuai usia",
      ageRange: [
        32,
        44
      ]
    },
    {
      id: "preschool_r069",
      name: "vocabulary_count - vocabulary_count_36_cukup",
      antecedents: [
        {
          key: "vocabulary_count",
          value: [
            "50-200 kata"
          ]
        }
      ],
      conclusion: "vocabulary_count_36_cukup",
      confidence: 0.7,
      severity: 0,
      recommendation: "Kemampuan vocabulary_count_36 cukup, terus berikan stimulasi",
      ageRange: [
        32,
        44
      ]
    },
    {
      id: "preschool_r070",
      name: "vocabulary_count - vocabulary_count_36_kurang",
      antecedents: [
        {
          key: "vocabulary_count",
          value: [
            "Kurang dari 50"
          ]
        }
      ],
      conclusion: "vocabulary_count_36_kurang",
      confidence: 0.85,
      severity: 2,
      recommendation: "Kemampuan vocabulary_count_36 kurang, perlu perhatian khusus",
      ageRange: [
        32,
        44
      ]
    },
    {
      id: "preschool_r071",
      name: "three_word_sentence - three_word_sentence_baik",
      antecedents: [
        {
          key: "three_word_sentence",
          value: [
            "Ya, dengan baik"
          ]
        }
      ],
      conclusion: "three_word_sentence_baik",
      confidence: 0.8,
      severity: 0,
      recommendation: "Kemampuan three_word_sentence sangat baik dan sesuai usia",
      ageRange: [
        32,
        44
      ]
    },
    {
      id: "preschool_r072",
      name: "three_word_sentence - three_word_sentence_cukup",
      antecedents: [
        {
          key: "three_word_sentence",
          value: [
            "Ya, kadang salah"
          ]
        }
      ],
      conclusion: "three_word_sentence_cukup",
      confidence: 0.7,
      severity: 0,
      recommendation: "Kemampuan three_word_sentence cukup, terus berikan stimulasi",
      ageRange: [
        32,
        44
      ]
    },
    {
      id: "preschool_r073",
      name: "three_word_sentence - three_word_sentence_kurang",
      antecedents: [
        {
          key: "three_word_sentence",
          value: [
            "Masih belajar",
            "Belum"
          ]
        }
      ],
      conclusion: "three_word_sentence_kurang",
      confidence: 0.85,
      severity: 2,
      recommendation: "Kemampuan three_word_sentence kurang, perlu perhatian khusus",
      ageRange: [
        32,
        44
      ]
    },
    {
      id: "preschool_r074",
      name: "speech_clarity - speech_clarity_36_baik",
      antecedents: [
        {
          key: "speech_clarity",
          value: [
            "Selalu"
          ]
        }
      ],
      conclusion: "speech_clarity_36_baik",
      confidence: 0.8,
      severity: 0,
      recommendation: "Kemampuan speech_clarity_36 sangat baik dan sesuai usia",
      ageRange: [
        32,
        44
      ]
    },
    {
      id: "preschool_r075",
      name: "speech_clarity - speech_clarity_36_cukup",
      antecedents: [
        {
          key: "speech_clarity",
          value: [
            "Kadang-kadang"
          ]
        }
      ],
      conclusion: "speech_clarity_36_cukup",
      confidence: 0.7,
      severity: 0,
      recommendation: "Kemampuan speech_clarity_36 cukup, terus berikan stimulasi",
      ageRange: [
        32,
        44
      ]
    },
    {
      id: "preschool_r076",
      name: "speech_clarity - speech_clarity_36_kurang",
      antecedents: [
        {
          key: "speech_clarity",
          value: [
            "Jarang",
            "Tidak"
          ]
        }
      ],
      conclusion: "speech_clarity_36_kurang",
      confidence: 0.85,
      severity: 2,
      recommendation: "Kemampuan speech_clarity_36 kurang, perlu perhatian khusus",
      ageRange: [
        32,
        44
      ]
    },
    {
      id: "preschool_r077",
      name: "narrative_skill - narrative_skill_baik",
      antecedents: [
        {
          key: "narrative_skill",
          value: [
            "Ya, detail"
          ]
        }
      ],
      conclusion: "narrative_skill_baik",
      confidence: 0.8,
      severity: 0,
      recommendation: "Kemampuan narrative_skill sangat baik dan sesuai usia",
      ageRange: [
        32,
        44
      ]
    },
    {
      id: "preschool_r078",
      name: "narrative_skill - narrative_skill_cukup",
      antecedents: [
        {
          key: "narrative_skill",
          value: [
            "Ya, singkat"
          ]
        }
      ],
      conclusion: "narrative_skill_cukup",
      confidence: 0.7,
      severity: 0,
      recommendation: "Kemampuan narrative_skill cukup, terus berikan stimulasi",
      ageRange: [
        32,
        44
      ]
    },
    {
      id: "preschool_r079",
      name: "narrative_skill - narrative_skill_kurang",
      antecedents: [
        {
          key: "narrative_skill",
          value: [
            "Kadang-kadang",
            "Belum"
          ]
        }
      ],
      conclusion: "narrative_skill_kurang",
      confidence: 0.85,
      severity: 2,
      recommendation: "Kemampuan narrative_skill kurang, perlu perhatian khusus",
      ageRange: [
        32,
        44
      ]
    },
    {
      id: "preschool_r080",
      name: "asking_why - asking_why_baik",
      antecedents: [
        {
          key: "asking_why",
          value: [
            "Ya, sering"
          ]
        }
      ],
      conclusion: "asking_why_baik",
      confidence: 0.8,
      severity: 0,
      recommendation: "Kemampuan asking_why sangat baik dan sesuai usia",
      ageRange: [
        32,
        44
      ]
    },
    {
      id: "preschool_r081",
      name: "asking_why - asking_why_cukup",
      antecedents: [
        {
          key: "asking_why",
          value: [
            "Kadang-kadang"
          ]
        }
      ],
      conclusion: "asking_why_cukup",
      confidence: 0.7,
      severity: 0,
      recommendation: "Kemampuan asking_why cukup, terus berikan stimulasi",
      ageRange: [
        32,
        44
      ]
    },
    {
      id: "preschool_r082",
      name: "asking_why - asking_why_kurang",
      antecedents: [
        {
          key: "asking_why",
          value: [
            "Jarang",
            "Tidak"
          ]
        }
      ],
      conclusion: "asking_why_kurang",
      confidence: 0.85,
      severity: 2,
      recommendation: "Kemampuan asking_why kurang, perlu perhatian khusus",
      ageRange: [
        32,
        44
      ]
    },
    {
      id: "preschool_r083",
      name: "color_recognition - color_recognition_baik",
      antecedents: [
        {
          key: "color_recognition",
          value: [
            "Ya, semua"
          ]
        }
      ],
      conclusion: "color_recognition_baik",
      confidence: 0.8,
      severity: 0,
      recommendation: "Kemampuan color_recognition sangat baik dan sesuai usia",
      ageRange: [
        32,
        44
      ]
    },
    {
      id: "preschool_r084",
      name: "color_recognition - color_recognition_cukup",
      antecedents: [
        {
          key: "color_recognition",
          value: [
            "Sebagian"
          ]
        }
      ],
      conclusion: "color_recognition_cukup",
      confidence: 0.7,
      severity: 0,
      recommendation: "Kemampuan color_recognition cukup, terus berikan stimulasi",
      ageRange: [
        32,
        44
      ]
    },
    {
      id: "preschool_r085",
      name: "color_recognition - color_recognition_kurang",
      antecedents: [
        {
          key: "color_recognition",
          value: [
            "Sedikit",
            "Belum"
          ]
        }
      ],
      conclusion: "color_recognition_kurang",
      confidence: 0.85,
      severity: 2,
      recommendation: "Kemampuan color_recognition kurang, perlu perhatian khusus",
      ageRange: [
        32,
        44
      ]
    },
    {
      id: "preschool_r086",
      name: "articulation_difficulty - articulation_difficulty_36_baik",
      antecedents: [
        {
          key: "articulation_difficulty",
          value: [
            "Tidak ada"
          ]
        }
      ],
      conclusion: "articulation_difficulty_36_baik",
      confidence: 0.8,
      severity: 0,
      recommendation: "Kemampuan articulation_difficulty_36 sangat baik dan sesuai usia",
      ageRange: [
        32,
        44
      ]
    },
    {
      id: "preschool_r087",
      name: "articulation_difficulty - articulation_difficulty_36_cukup",
      antecedents: [
        {
          key: "articulation_difficulty",
          value: [
            "Sedikit"
          ]
        }
      ],
      conclusion: "articulation_difficulty_36_cukup",
      confidence: 0.7,
      severity: 0,
      recommendation: "Kemampuan articulation_difficulty_36 cukup, terus berikan stimulasi",
      ageRange: [
        32,
        44
      ]
    },
    {
      id: "preschool_r088",
      name: "articulation_difficulty - articulation_difficulty_36_kurang",
      antecedents: [
        {
          key: "articulation_difficulty",
          value: [
            "Banyak",
            "Tidak yakin"
          ]
        }
      ],
      conclusion: "articulation_difficulty_36_kurang",
      confidence: 0.85,
      severity: 2,
      recommendation: "Kemampuan articulation_difficulty_36 kurang, perlu perhatian khusus",
      ageRange: [
        32,
        44
      ]
    },
    {
      id: "preschool_r089",
      name: "pretend_play - pretend_play_baik",
      antecedents: [
        {
          key: "pretend_play",
          value: [
            "Ya"
          ]
        }
      ],
      conclusion: "pretend_play_baik",
      confidence: 0.8,
      severity: 0,
      recommendation: "Kemampuan pretend_play sangat baik dan sesuai usia",
      ageRange: [
        32,
        44
      ]
    },
    {
      id: "preschool_r090",
      name: "pretend_play - pretend_play_cukup",
      antecedents: [
        {
          key: "pretend_play",
          value: [
            "Kadang-kadang"
          ]
        }
      ],
      conclusion: "pretend_play_cukup",
      confidence: 0.7,
      severity: 0,
      recommendation: "Kemampuan pretend_play cukup, terus berikan stimulasi",
      ageRange: [
        32,
        44
      ]
    },
    {
      id: "preschool_r091",
      name: "pretend_play - pretend_play_kurang",
      antecedents: [
        {
          key: "pretend_play",
          value: [
            "Jarang",
            "Tidak"
          ]
        }
      ],
      conclusion: "pretend_play_kurang",
      confidence: 0.85,
      severity: 2,
      recommendation: "Kemampuan pretend_play kurang, perlu perhatian khusus",
      ageRange: [
        32,
        44
      ]
    },
    {
      id: "preschool_r092",
      name: "vocabulary_count - vocabulary_count_48_baik",
      antecedents: [
        {
          key: "vocabulary_count",
          value: [
            "500-1000 kata",
            "Lebih dari 1000"
          ]
        }
      ],
      conclusion: "vocabulary_count_48_baik",
      confidence: 0.8,
      severity: 0,
      recommendation: "Kemampuan vocabulary_count_48 sangat baik dan sesuai usia",
      ageRange: [
        44,
        56
      ]
    },
    {
      id: "preschool_r093",
      name: "vocabulary_count - vocabulary_count_48_cukup",
      antecedents: [
        {
          key: "vocabulary_count",
          value: [
            "200-500 kata"
          ]
        }
      ],
      conclusion: "vocabulary_count_48_cukup",
      confidence: 0.7,
      severity: 0,
      recommendation: "Kemampuan vocabulary_count_48 cukup, terus berikan stimulasi",
      ageRange: [
        44,
        56
      ]
    },
    {
      id: "preschool_r094",
      name: "vocabulary_count - vocabulary_count_48_kurang",
      antecedents: [
        {
          key: "vocabulary_count",
          value: [
            "Kurang dari 200"
          ]
        }
      ],
      conclusion: "vocabulary_count_48_kurang",
      confidence: 0.85,
      severity: 2,
      recommendation: "Kemampuan vocabulary_count_48 kurang, perlu perhatian khusus",
      ageRange: [
        44,
        56
      ]
    },
    {
      id: "preschool_r095",
      name: "storytelling - storytelling_baik",
      antecedents: [
        {
          key: "storytelling",
          value: [
            "Ya, baik"
          ]
        }
      ],
      conclusion: "storytelling_baik",
      confidence: 0.8,
      severity: 0,
      recommendation: "Kemampuan storytelling sangat baik dan sesuai usia",
      ageRange: [
        44,
        56
      ]
    },
    {
      id: "preschool_r096",
      name: "storytelling - storytelling_cukup",
      antecedents: [
        {
          key: "storytelling",
          value: [
            "Ya, sederhana"
          ]
        }
      ],
      conclusion: "storytelling_cukup",
      confidence: 0.7,
      severity: 0,
      recommendation: "Kemampuan storytelling cukup, terus berikan stimulasi",
      ageRange: [
        44,
        56
      ]
    },
    {
      id: "preschool_r097",
      name: "storytelling - storytelling_kurang",
      antecedents: [
        {
          key: "storytelling",
          value: [
            "Kadang-kadang",
            "Belum"
          ]
        }
      ],
      conclusion: "storytelling_kurang",
      confidence: 0.85,
      severity: 2,
      recommendation: "Kemampuan storytelling kurang, perlu perhatian khusus",
      ageRange: [
        44,
        56
      ]
    },
    {
      id: "preschool_r098",
      name: "speech_clarity - speech_clarity_48_baik",
      antecedents: [
        {
          key: "speech_clarity",
          value: [
            "Ya"
          ]
        }
      ],
      conclusion: "speech_clarity_48_baik",
      confidence: 0.8,
      severity: 0,
      recommendation: "Kemampuan speech_clarity_48 sangat baik dan sesuai usia",
      ageRange: [
        44,
        56
      ]
    },
    {
      id: "preschool_r099",
      name: "speech_clarity - speech_clarity_48_cukup",
      antecedents: [
        {
          key: "speech_clarity",
          value: [
            "Sebagian besar"
          ]
        }
      ],
      conclusion: "speech_clarity_48_cukup",
      confidence: 0.7,
      severity: 0,
      recommendation: "Kemampuan speech_clarity_48 cukup, terus berikan stimulasi",
      ageRange: [
        44,
        56
      ]
    },
    {
      id: "preschool_r100",
      name: "speech_clarity - speech_clarity_48_kurang",
      antecedents: [
        {
          key: "speech_clarity",
          value: [
            "Sebagian",
            "Sulit dipahami"
          ]
        }
      ],
      conclusion: "speech_clarity_48_kurang",
      confidence: 0.85,
      severity: 2,
      recommendation: "Kemampuan speech_clarity_48 kurang, perlu perhatian khusus",
      ageRange: [
        44,
        56
      ]
    },
    {
      id: "preschool_r101",
      name: "answer_questions - answer_questions_48_baik",
      antecedents: [
        {
          key: "answer_questions",
          value: [
            "Ya, semua"
          ]
        }
      ],
      conclusion: "answer_questions_48_baik",
      confidence: 0.8,
      severity: 0,
      recommendation: "Kemampuan answer_questions_48 sangat baik dan sesuai usia",
      ageRange: [
        44,
        56
      ]
    },
    {
      id: "preschool_r102",
      name: "answer_questions - answer_questions_48_cukup",
      antecedents: [
        {
          key: "answer_questions",
          value: [
            "Sebagian besar"
          ]
        }
      ],
      conclusion: "answer_questions_48_cukup",
      confidence: 0.7,
      severity: 0,
      recommendation: "Kemampuan answer_questions_48 cukup, terus berikan stimulasi",
      ageRange: [
        44,
        56
      ]
    },
    {
      id: "preschool_r103",
      name: "answer_questions - answer_questions_48_kurang",
      antecedents: [
        {
          key: "answer_questions",
          value: [
            "Sebagian",
            "Belum"
          ]
        }
      ],
      conclusion: "answer_questions_48_kurang",
      confidence: 0.85,
      severity: 2,
      recommendation: "Kemampuan answer_questions_48 kurang, perlu perhatian khusus",
      ageRange: [
        44,
        56
      ]
    },
    {
      id: "preschool_r104",
      name: "letter_difficulty - letter_difficulty_baik",
      antecedents: [
        {
          key: "letter_difficulty",
          value: [
            "Tidak"
          ]
        }
      ],
      conclusion: "letter_difficulty_baik",
      confidence: 0.8,
      severity: 0,
      recommendation: "Kemampuan letter_difficulty sangat baik dan sesuai usia",
      ageRange: [
        44,
        56
      ]
    },
    {
      id: "preschool_r105",
      name: "letter_difficulty - letter_difficulty_cukup",
      antecedents: [
        {
          key: "letter_difficulty",
          value: [
            "Sedikit"
          ]
        }
      ],
      conclusion: "letter_difficulty_cukup",
      confidence: 0.7,
      severity: 0,
      recommendation: "Kemampuan letter_difficulty cukup, terus berikan stimulasi",
      ageRange: [
        44,
        56
      ]
    },
    {
      id: "preschool_r106",
      name: "letter_difficulty - letter_difficulty_kurang",
      antecedents: [
        {
          key: "letter_difficulty",
          value: [
            "Banyak",
            "Sangat banyak"
          ]
        }
      ],
      conclusion: "letter_difficulty_kurang",
      confidence: 0.85,
      severity: 2,
      recommendation: "Kemampuan letter_difficulty kurang, perlu perhatian khusus",
      ageRange: [
        44,
        56
      ]
    },
    {
      id: "preschool_r107",
      name: "sing_songs - sing_songs_baik",
      antecedents: [
        {
          key: "sing_songs",
          value: [
            "Ya"
          ]
        }
      ],
      conclusion: "sing_songs_baik",
      confidence: 0.8,
      severity: 0,
      recommendation: "Kemampuan sing_songs sangat baik dan sesuai usia",
      ageRange: [
        44,
        56
      ]
    },
    {
      id: "preschool_r108",
      name: "sing_songs - sing_songs_cukup",
      antecedents: [
        {
          key: "sing_songs",
          value: [
            "Sebagian"
          ]
        }
      ],
      conclusion: "sing_songs_cukup",
      confidence: 0.7,
      severity: 0,
      recommendation: "Kemampuan sing_songs cukup, terus berikan stimulasi",
      ageRange: [
        44,
        56
      ]
    },
    {
      id: "preschool_r109",
      name: "sing_songs - sing_songs_kurang",
      antecedents: [
        {
          key: "sing_songs",
          value: [
            "Sedikit",
            "Tidak"
          ]
        }
      ],
      conclusion: "sing_songs_kurang",
      confidence: 0.85,
      severity: 2,
      recommendation: "Kemampuan sing_songs kurang, perlu perhatian khusus",
      ageRange: [
        44,
        56
      ]
    },
    {
      id: "preschool_r110",
      name: "social_play - social_play_baik",
      antecedents: [
        {
          key: "social_play",
          value: [
            "Ya, baik"
          ]
        }
      ],
      conclusion: "social_play_baik",
      confidence: 0.8,
      severity: 0,
      recommendation: "Kemampuan social_play sangat baik dan sesuai usia",
      ageRange: [
        44,
        56
      ]
    },
    {
      id: "preschool_r111",
      name: "social_play - social_play_cukup",
      antecedents: [
        {
          key: "social_play",
          value: [
            "Ya, kadang konflik"
          ]
        }
      ],
      conclusion: "social_play_cukup",
      confidence: 0.7,
      severity: 0,
      recommendation: "Kemampuan social_play cukup, terus berikan stimulasi",
      ageRange: [
        44,
        56
      ]
    },
    {
      id: "preschool_r112",
      name: "social_play - social_play_kurang",
      antecedents: [
        {
          key: "social_play",
          value: [
            "Sulit",
            "Prefer sendiri"
          ]
        }
      ],
      conclusion: "social_play_kurang",
      confidence: 0.85,
      severity: 2,
      recommendation: "Kemampuan social_play kurang, perlu perhatian khusus",
      ageRange: [
        44,
        56
      ]
    },
    {
      id: "preschool_r113",
      name: "quantity_concept - quantity_concept_baik",
      antecedents: [
        {
          key: "quantity_concept",
          value: [
            "Ya"
          ]
        }
      ],
      conclusion: "quantity_concept_baik",
      confidence: 0.8,
      severity: 0,
      recommendation: "Perkembangan quantity_concept menunjukkan hasil positif",
      ageRange: [
        44,
        56
      ]
    },
    {
      id: "preschool_r114",
      name: "quantity_concept - quantity_concept_cukup",
      antecedents: [
        {
          key: "quantity_concept",
          value: [
            "Kadang-kadang"
          ]
        }
      ],
      conclusion: "quantity_concept_cukup",
      confidence: 0.7,
      severity: 0,
      recommendation: "Perkembangan quantity_concept dalam tahap belajar, berikan stimulasi",
      ageRange: [
        44,
        56
      ]
    },
    {
      id: "preschool_r115",
      name: "quantity_concept - quantity_concept_kurang",
      antecedents: [
        {
          key: "quantity_concept",
          value: [
            "Belum"
          ]
        }
      ],
      conclusion: "quantity_concept_kurang",
      confidence: 0.9,
      severity: 2,
      recommendation: "Perkembangan quantity_concept terlambat, segera konsultasikan",
      ageRange: [
        44,
        56
      ]
    },
    {
      id: "preschool_r116",
      name: "vocabulary_count - vocabulary_count_60_baik",
      antecedents: [
        {
          key: "vocabulary_count",
          value: [
            "1500-2500 kata",
            "Lebih dari 2500"
          ]
        }
      ],
      conclusion: "vocabulary_count_60_baik",
      confidence: 0.8,
      severity: 0,
      recommendation: "Kemampuan vocabulary_count_60 sangat baik dan sesuai usia",
      ageRange: [
        56,
        999
      ]
    },
    {
      id: "preschool_r117",
      name: "vocabulary_count - vocabulary_count_60_cukup",
      antecedents: [
        {
          key: "vocabulary_count",
          value: [
            "500-1500 kata"
          ]
        }
      ],
      conclusion: "vocabulary_count_60_cukup",
      confidence: 0.7,
      severity: 0,
      recommendation: "Kemampuan vocabulary_count_60 cukup, terus berikan stimulasi",
      ageRange: [
        56,
        999
      ]
    },
    {
      id: "preschool_r118",
      name: "vocabulary_count - vocabulary_count_60_kurang",
      antecedents: [
        {
          key: "vocabulary_count",
          value: [
            "Kurang dari 500"
          ]
        }
      ],
      conclusion: "vocabulary_count_60_kurang",
      confidence: 0.85,
      severity: 2,
      recommendation: "Kemampuan vocabulary_count_60 kurang, perlu perhatian khusus",
      ageRange: [
        56,
        999
      ]
    },
    {
      id: "preschool_r119",
      name: "story_structure - story_structure_baik",
      antecedents: [
        {
          key: "story_structure",
          value: [
            "Ya"
          ]
        }
      ],
      conclusion: "story_structure_baik",
      confidence: 0.8,
      severity: 0,
      recommendation: "Kemampuan story_structure sangat baik dan sesuai usia",
      ageRange: [
        56,
        999
      ]
    },
    {
      id: "preschool_r120",
      name: "story_structure - story_structure_cukup",
      antecedents: [
        {
          key: "story_structure",
          value: [
            "Ya, sederhana"
          ]
        }
      ],
      conclusion: "story_structure_cukup",
      confidence: 0.7,
      severity: 0,
      recommendation: "Kemampuan story_structure cukup, terus berikan stimulasi",
      ageRange: [
        56,
        999
      ]
    },
    {
      id: "preschool_r121",
      name: "story_structure - story_structure_kurang",
      antecedents: [
        {
          key: "story_structure",
          value: [
            "Kadang-kadang",
            "Belum"
          ]
        }
      ],
      conclusion: "story_structure_kurang",
      confidence: 0.85,
      severity: 2,
      recommendation: "Kemampuan story_structure kurang, perlu perhatian khusus",
      ageRange: [
        56,
        999
      ]
    },
    {
      id: "preschool_r122",
      name: "speech_clarity - speech_clarity_60_baik",
      antecedents: [
        {
          key: "speech_clarity",
          value: [
            "Ya, semua"
          ]
        }
      ],
      conclusion: "speech_clarity_60_baik",
      confidence: 0.8,
      severity: 0,
      recommendation: "Kemampuan speech_clarity_60 sangat baik dan sesuai usia",
      ageRange: [
        56,
        999
      ]
    },
    {
      id: "preschool_r123",
      name: "speech_clarity - speech_clarity_60_cukup",
      antecedents: [
        {
          key: "speech_clarity",
          value: [
            "Ya, hampir semua"
          ]
        }
      ],
      conclusion: "speech_clarity_60_cukup",
      confidence: 0.7,
      severity: 0,
      recommendation: "Kemampuan speech_clarity_60 cukup, terus berikan stimulasi",
      ageRange: [
        56,
        999
      ]
    },
    {
      id: "preschool_r124",
      name: "speech_clarity - speech_clarity_60_kurang",
      antecedents: [
        {
          key: "speech_clarity",
          value: [
            "Sebagian",
            "Sulit"
          ]
        }
      ],
      conclusion: "speech_clarity_60_kurang",
      confidence: 0.85,
      severity: 2,
      recommendation: "Kemampuan speech_clarity_60 kurang, perlu perhatian khusus",
      ageRange: [
        56,
        999
      ]
    },
    {
      id: "preschool_r125",
      name: "articulation_difficulty - articulation_difficulty_60_baik",
      antecedents: [
        {
          key: "articulation_difficulty",
          value: [
            "Tidak ada"
          ]
        }
      ],
      conclusion: "articulation_difficulty_60_baik",
      confidence: 0.8,
      severity: 0,
      recommendation: "Kemampuan articulation_difficulty_60 sangat baik dan sesuai usia",
      ageRange: [
        56,
        999
      ]
    },
    {
      id: "preschool_r126",
      name: "articulation_difficulty - articulation_difficulty_60_cukup",
      antecedents: [
        {
          key: "articulation_difficulty",
          value: [
            "R/S/L sedikit"
          ]
        }
      ],
      conclusion: "articulation_difficulty_60_cukup",
      confidence: 0.7,
      severity: 0,
      recommendation: "Kemampuan articulation_difficulty_60 cukup, terus berikan stimulasi",
      ageRange: [
        56,
        999
      ]
    },
    {
      id: "preschool_r127",
      name: "articulation_difficulty - articulation_difficulty_60_kurang",
      antecedents: [
        {
          key: "articulation_difficulty",
          value: [
            "Banyak huruf",
            "Sangat banyak"
          ]
        }
      ],
      conclusion: "articulation_difficulty_60_kurang",
      confidence: 0.85,
      severity: 2,
      recommendation: "Kemampuan articulation_difficulty_60 kurang, perlu perhatian khusus",
      ageRange: [
        56,
        999
      ]
    },
    {
      id: "preschool_r128",
      name: "follow_rules - follow_rules_baik",
      antecedents: [
        {
          key: "follow_rules",
          value: [
            "Ya, baik"
          ]
        }
      ],
      conclusion: "follow_rules_baik",
      confidence: 0.8,
      severity: 0,
      recommendation: "Kemampuan follow_rules sangat baik dan sesuai usia",
      ageRange: [
        56,
        999
      ]
    },
    {
      id: "preschool_r129",
      name: "follow_rules - follow_rules_cukup",
      antecedents: [
        {
          key: "follow_rules",
          value: [
            "Ya, kadang perlu bantuan"
          ]
        }
      ],
      conclusion: "follow_rules_cukup",
      confidence: 0.7,
      severity: 0,
      recommendation: "Kemampuan follow_rules cukup, terus berikan stimulasi",
      ageRange: [
        56,
        999
      ]
    },
    {
      id: "preschool_r130",
      name: "follow_rules - follow_rules_kurang",
      antecedents: [
        {
          key: "follow_rules",
          value: [
            "Sulit",
            "Belum pernah"
          ]
        }
      ],
      conclusion: "follow_rules_kurang",
      confidence: 0.85,
      severity: 2,
      recommendation: "Kemampuan follow_rules kurang, perlu perhatian khusus",
      ageRange: [
        56,
        999
      ]
    },
    {
      id: "preschool_r131",
      name: "complex_questions - complex_questions_baik",
      antecedents: [
        {
          key: "complex_questions",
          value: [
            "Ya, semua"
          ]
        }
      ],
      conclusion: "complex_questions_baik",
      confidence: 0.8,
      severity: 0,
      recommendation: "Kemampuan complex_questions sangat baik dan sesuai usia",
      ageRange: [
        56,
        999
      ]
    },
    {
      id: "preschool_r132",
      name: "complex_questions - complex_questions_cukup",
      antecedents: [
        {
          key: "complex_questions",
          value: [
            "Ya, sebagian"
          ]
        }
      ],
      conclusion: "complex_questions_cukup",
      confidence: 0.7,
      severity: 0,
      recommendation: "Kemampuan complex_questions cukup, terus berikan stimulasi",
      ageRange: [
        56,
        999
      ]
    },
    {
      id: "preschool_r133",
      name: "complex_questions - complex_questions_kurang",
      antecedents: [
        {
          key: "complex_questions",
          value: [
            "Sedikit",
            "Belum"
          ]
        }
      ],
      conclusion: "complex_questions_kurang",
      confidence: 0.85,
      severity: 2,
      recommendation: "Kemampuan complex_questions kurang, perlu perhatian khusus",
      ageRange: [
        56,
        999
      ]
    },
    {
      id: "preschool_r134",
      name: "speech_comparison - speech_comparison_baik",
      antecedents: [
        {
          key: "speech_comparison",
          value: [
            "Ya, lebih jelas"
          ]
        }
      ],
      conclusion: "speech_comparison_baik",
      confidence: 0.8,
      severity: 0,
      recommendation: "Kemampuan speech_comparison sangat baik dan sesuai usia",
      ageRange: [
        56,
        999
      ]
    },
    {
      id: "preschool_r135",
      name: "speech_comparison - speech_comparison_cukup",
      antecedents: [
        {
          key: "speech_comparison",
          value: [
            "Serupa"
          ]
        }
      ],
      conclusion: "speech_comparison_cukup",
      confidence: 0.7,
      severity: 0,
      recommendation: "Kemampuan speech_comparison cukup, terus berikan stimulasi",
      ageRange: [
        56,
        999
      ]
    },
    {
      id: "preschool_r136",
      name: "speech_comparison - speech_comparison_kurang",
      antecedents: [
        {
          key: "speech_comparison",
          value: [
            "Kurang jelas",
            "Jauh berbeda"
          ]
        }
      ],
      conclusion: "speech_comparison_kurang",
      confidence: 0.85,
      severity: 2,
      recommendation: "Kemampuan speech_comparison kurang, perlu perhatian khusus",
      ageRange: [
        56,
        999
      ]
    },
    {
      id: "preschool_r137",
      name: "express_feelings - express_feelings_baik",
      antecedents: [
        {
          key: "express_feelings",
          value: [
            "Ya, dengan baik"
          ]
        }
      ],
      conclusion: "express_feelings_baik",
      confidence: 0.8,
      severity: 0,
      recommendation: "Kemampuan express_feelings sangat baik dan sesuai usia",
      ageRange: [
        56,
        999
      ]
    },
    {
      id: "preschool_r138",
      name: "express_feelings - express_feelings_cukup",
      antecedents: [
        {
          key: "express_feelings",
          value: [
            "Ya"
          ]
        }
      ],
      conclusion: "express_feelings_cukup",
      confidence: 0.7,
      severity: 0,
      recommendation: "Kemampuan express_feelings cukup, terus berikan stimulasi",
      ageRange: [
        56,
        999
      ]
    },
    {
      id: "preschool_r139",
      name: "express_feelings - express_feelings_kurang",
      antecedents: [
        {
          key: "express_feelings",
          value: [
            "Kadang-kadang",
            "Belum"
          ]
        }
      ],
      conclusion: "express_feelings_kurang",
      confidence: 0.85,
      severity: 2,
      recommendation: "Kemampuan express_feelings kurang, perlu perhatian khusus",
      ageRange: [
        56,
        999
      ]
    }
  ],
  universal: [
    {
      id: "universal_r001",
      name: "family_history - faktor_risiko_genetik",
      antecedents: [
        {
          key: "family_history",
          value: [
            "Ya"
          ]
        }
      ],
      conclusion: "faktor_risiko_genetik",
      confidence: 0.8,
      severity: 1,
      recommendation: "Faktor genetik meningkatkan risiko speech delay"
    },
    {
      id: "universal_r002",
      name: "family_history - tidak_ada_risiko_genetik",
      antecedents: [
        {
          key: "family_history",
          value: [
            "Tidak",
            "Tidak tahu"
          ]
        }
      ],
      conclusion: "tidak_ada_risiko_genetik",
      confidence: 0.8,
      severity: 0,
      recommendation: "Tidak ada riwayat keluarga, indikator baik"
    },
    {
      id: "universal_r003",
      name: "hearing_issues - respon_pendengaran_delayed",
      antecedents: [
        {
          key: "hearing_issues",
          value: [
            "Ya"
          ]
        }
      ],
      conclusion: "respon_pendengaran_delayed",
      confidence: 0.95,
      severity: 3,
      recommendation: "Riwayat pendengaran - prioritas tinggi untuk evaluasi THT"
    },
    {
      id: "universal_r004",
      name: "hearing_issues - pendengaran_normal",
      antecedents: [
        {
          key: "hearing_issues",
          value: [
            "Tidak",
            "Tidak yakin"
          ]
        }
      ],
      conclusion: "pendengaran_normal",
      confidence: 0.9,
      severity: 0,
      recommendation: "Tidak ada indikasi masalah pendengaran"
    },
    {
      id: "universal_r005",
      name: "parent_concern - perlu_monitoring",
      antecedents: [
        {
          key: "parent_concern",
          value: [
            "Ya"
          ]
        }
      ],
      conclusion: "perlu_monitoring",
      confidence: 0.8,
      severity: 1,
      recommendation: "Kekhawatiran orang tua perlu diperhatikan"
    },
    {
      id: "universal_r006",
      name: "parent_concern - pantau_ringan",
      antecedents: [
        {
          key: "parent_concern",
          value: [
            "Tidak yakin"
          ]
        }
      ],
      conclusion: "pantau_ringan",
      confidence: 0.6,
      severity: 0,
      recommendation: "Lakukan observasi perkembangan anak"
    },
    {
      id: "universal_r007",
      name: "parent_concern - tidak_ada_kekhawatiran",
      antecedents: [
        {
          key: "parent_concern",
          value: [
            "Tidak"
          ]
        }
      ],
      conclusion: "tidak_ada_kekhawatiran",
      confidence: 0.8,
      severity: 0,
      recommendation: "Orang tua merasa perkembangan anak sesuai"
    },
    {
      id: "universal_r008",
      name: "eye_contact - eye_contact_baik",
      antecedents: [
        {
          key: "eye_contact",
          value: [
            "Selalu"
          ]
        }
      ],
      conclusion: "eye_contact_baik",
      confidence: 0.8,
      severity: 0,
      recommendation: "Kemampuan eye_contact sangat baik dan sesuai usia"
    },
    {
      id: "universal_r009",
      name: "eye_contact - eye_contact_cukup",
      antecedents: [
        {
          key: "eye_contact",
          value: [
            "Kadang-kadang"
          ]
        }
      ],
      conclusion: "eye_contact_cukup",
      confidence: 0.7,
      severity: 0,
      recommendation: "Kemampuan eye_contact cukup, terus berikan stimulasi"
    },
    {
      id: "universal_r010",
      name: "eye_contact - eye_contact_kurang",
      antecedents: [
        {
          key: "eye_contact",
          value: [
            "Jarang",
            "Tidak pernah"
          ]
        }
      ],
      conclusion: "eye_contact_kurang",
      confidence: 0.85,
      severity: 2,
      recommendation: "Kemampuan eye_contact kurang, perlu perhatian khusus"
    },
    {
      id: "universal_r011",
      name: "pointing - pointing_baik",
      antecedents: [
        {
          key: "pointing",
          value: [
            "Ya, sering"
          ]
        }
      ],
      conclusion: "pointing_baik",
      confidence: 0.8,
      severity: 0,
      recommendation: "Kemampuan pointing sangat baik dan sesuai usia"
    },
    {
      id: "universal_r012",
      name: "pointing - pointing_cukup",
      antecedents: [
        {
          key: "pointing",
          value: [
            "Kadang-kadang"
          ]
        }
      ],
      conclusion: "pointing_cukup",
      confidence: 0.7,
      severity: 0,
      recommendation: "Kemampuan pointing cukup, terus berikan stimulasi"
    },
    {
      id: "universal_r013",
      name: "pointing - pointing_kurang",
      antecedents: [
        {
          key: "pointing",
          value: [
            "Jarang",
            "Tidak"
          ]
        }
      ],
      conclusion: "pointing_kurang",
      confidence: 0.85,
      severity: 2,
      recommendation: "Kemampuan pointing kurang, perlu perhatian khusus"
    },
    {
      id: "universal_r014",
      name: "social_smile - social_smile_baik",
      antecedents: [
        {
          key: "social_smile",
          value: [
            "Sering"
          ]
        }
      ],
      conclusion: "social_smile_baik",
      confidence: 0.8,
      severity: 0,
      recommendation: "Kemampuan social_smile sangat baik dan sesuai usia"
    },
    {
      id: "universal_r015",
      name: "social_smile - social_smile_cukup",
      antecedents: [
        {
          key: "social_smile",
          value: [
            "Kadang-kadang"
          ]
        }
      ],
      conclusion: "social_smile_cukup",
      confidence: 0.7,
      severity: 0,
      recommendation: "Kemampuan social_smile cukup, terus berikan stimulasi"
    },
    {
      id: "universal_r016",
      name: "social_smile - social_smile_kurang",
      antecedents: [
        {
          key: "social_smile",
          value: [
            "Jarang",
            "Tidak"
          ]
        }
      ],
      conclusion: "social_smile_kurang",
      confidence: 0.85,
      severity: 2,
      recommendation: "Kemampuan social_smile kurang, perlu perhatian khusus"
    },
    {
      id: "universal_r017",
      name: "show_objects - show_objects_baik",
      antecedents: [
        {
          key: "show_objects",
          value: [
            "Ya, sering"
          ]
        }
      ],
      conclusion: "show_objects_baik",
      confidence: 0.8,
      severity: 0,
      recommendation: "Kemampuan show_objects sangat baik dan sesuai usia"
    },
    {
      id: "universal_r018",
      name: "show_objects - show_objects_cukup",
      antecedents: [
        {
          key: "show_objects",
          value: [
            "Kadang-kadang"
          ]
        }
      ],
      conclusion: "show_objects_cukup",
      confidence: 0.7,
      severity: 0,
      recommendation: "Kemampuan show_objects cukup, terus berikan stimulasi"
    },
    {
      id: "universal_r019",
      name: "show_objects - show_objects_kurang",
      antecedents: [
        {
          key: "show_objects",
          value: [
            "Jarang",
            "Tidak"
          ]
        }
      ],
      conclusion: "show_objects_kurang",
      confidence: 0.85,
      severity: 2,
      recommendation: "Kemampuan show_objects kurang, perlu perhatian khusus"
    }
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
    for (const fact of derivedFacts) { 
      if (fact.endsWith('_kurang') || fact.endsWith('_delayed') || DELAY_INDICATORS.includes(fact)) {
        delayCount++; 
      }
    }

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