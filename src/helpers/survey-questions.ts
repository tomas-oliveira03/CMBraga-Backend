export enum CategoryIntensity {
    NONE = "Nada",
    LOW = "Pouco",
    MODERATE = "Moderadamente",
    HIGH = "Muito",
    TOTAL = "Totalmente",
}

export enum CategoryFrequency {
    NEVER = "Nunca",
    RARELY = "Raramente",
    SOMETIMES = "Algumas vezes",
    OFTEN = "Frequentemente",
    ALWAYS = "Sempre",
}

export enum CategoryQuality {
    VERY_BAD = "Muito má",
    BAD = "Má",
    GOOD = "Boa",
    VERY_GOOD = "Muito Boa",
    EXCELLENT = "Excelente",
}

export const CategoryIntensityList = [
    CategoryIntensity.NONE,
    CategoryIntensity.LOW,
    CategoryIntensity.MODERATE,
    CategoryIntensity.HIGH,
    CategoryIntensity.TOTAL,
]

export const CategoryFrequencyList = [
    CategoryFrequency.NEVER,
    CategoryFrequency.RARELY,
    CategoryFrequency.SOMETIMES,
    CategoryFrequency.OFTEN,
    CategoryFrequency.ALWAYS,
]

export const CategoryQualityList = [
    CategoryQuality.VERY_BAD,
    CategoryQuality.BAD,
    CategoryQuality.GOOD,
    CategoryQuality.VERY_GOOD,
    CategoryQuality.EXCELLENT,
]

export const kidsQuestionaryIntro =`Olá, 
Como estás? É isso que queríamos que tu nos contes.
Por favor lê todas as questões cuidadosamente. Que resposta vem primeiro à tua cabeça? Escolhe e assinala a resposta mais adequada ao teu caso.

Lembra-te: isto não é um teste, portanto não existem respostas erradas. É importante que respondas a todas as questões para podermos perceber as tuas respostas claramente. Quando pensas na tua resposta, por favor tenta pensar na tua última semana.

Não tens que mostrar as tuas respostas a ninguém, e ninguém teu conhecido vai ver o teu questionário depois de o teres terminado.`;


export const parentsQuestionaryIntro =`Pais, Como é o/a seu/sua filho(a)?

Como é que ele/ela se sente? É isso que queremos saber através de si.
Por favor responda às seguintes questões com todo o seu conhecimento, assegurando que as suas
respostas reflectem a perspectiva do/da seu/sua filho(a).

Por favor tente recordar as experiências do/da seu/sua filho(a) na última semana … `;


export const numberOfQuestions = 27;


export const kidsQuestions: QuestionnaireSurvey = [
    {
        section: "Bem-Estar Físico",
        data: [
            {
                context: "Em geral, como descreves a tua saúde?",
                questions : [
                    {1: "Em geral, como descreves a tua saúde?"},
                ],
                answerTypes: CategoryQualityList,
            },
            {
                context: "Pensa na última semana...",
                questions : [
                    {2: "Sentiste-te bem e em forma?"},
                    {3: "Estiveste fisicamente ativo (ex: correste, fizeste escalada, andaste de bicicleta)?"},
                    {4: "Foste capaz de correr bem?"},
                    {5: "Sentiste-te cheio(a) de energia?"},
                ],
                answerTypes: CategoryIntensityList,
            }
        ],
    },
    {
        section: "Bem-Estar Psicológico",
        data: [
            {
                context: "Pensa na última semana...",
                questions : [
                    {6: "A tua vida tem sido agradável?"},
                    {7: "Estiveste de bom humor?"},
                    {8: "Divertiste-te?"},
                    {9: "Sentiste-te triste?"},
                    {10: "Sentiste-te tão mal que não quiseste fazer mais nada?"},
                    {11: "Sentiste-te sozinho(a)?"},
                    {12: "Sentiste-te feliz com a tua maneira de ser?"},
                ],
                answerTypes: CategoryIntensityList,
            }
        ],
    },
    {
        section: "Autonomia e Relação com os Pais",
        data: [
            {
                context: "Pensa na última semana...",
                questions : [
                    {13: "Tiveste tempo suficiente para ti próprio(a)?"},
                    {14: "Foste capaz de fazer actividades que gostas de fazer no teu tempo livre?"},
                    {15: "Os teus pais tiveram tempo suficiente para ti?"},
                    {16: "Os teus pais trataram-te com justiça?"},
                    {17: "Foste capaz de conversar com os teus pais quando quiseste?"},
                    {18: "Tiveste dinheiro suficiente para fazer as mesmas actividades que os teus amigos(as)?"},
                    {19: "Tiveste dinheiro suficiente para as tuas despesas?"},
                ],
                answerTypes: CategoryFrequencyList,
            }
        ],
    },
    {
        section: "Apoio Social e Grupo de Pares",
        data: [
            {
                context: "Pensa na última semana...",
                questions : [
                    {20: "Passaste tempo com os teus amigos(as)?"},
                    {21: "Divertiste-te com os teus amigos(as)? "},
                    {22: "Tu e os teus/tuas amigos(as) ajudaramse uns aos outros?"},
                    {23: "Sentiste que podes confiar nos(as) teus/tuas amigos(as)? "},
                ],
                answerTypes: CategoryFrequencyList,
            }   
        ],
    },
    {
        section: "Ambiente Escolar",
        data: [
            {
                context: "Pensa na última semana...",
                questions : [
                    {24: "Sentiste-te feliz na escola?"},
                    {25: "Foste bom/boa aluno(a) na escola?"},
                    {26: "Sentiste-te capaz de prestar atenção?"},
                    {27: "Tiveste uma boa relação com os teus professores?"},
                ],
                answerTypes: CategoryIntensityList,
            }   
        ],
    },
]

export const parentsQuestions: QuestionnaireSurvey = [
    {
        section: "Bem-Estar Físico",
        data: [
            {
                context: "Em geral, como descreve a saúde do (a) seu/sua filho(a)?",
                questions : [
                    {1: "Em geral, como descreve a saúde do (a) seu/sua filho(a)?"}
                ],  
                answerTypes: CategoryQualityList,
            },
            {
                context: "Pense na última semana...",
                questions : [
                    {2: "O/A seu/sua filho(a) sentiu-se bem e em forma?"},
                    {3: "O/A seu/sua filho(a) esteve fisicamente activo(a) (ex: correr, escalada, andar de bicicleta)?"},
                    {4: "O/A seu/sua filho(a) foi capaz de correr bem?"},
                    {5: "O/A seu/sua filho(a) sentiu-se cheio(a) de energia?"},
                ],
                answerTypes: CategoryIntensityList,
            }
        ],
    },
    {
        section: "Bem-Estar Psicológico",
        data: [
            {
                context: "Pense na última semana...",
                questions : [
                    {6: "O/A seu/sua filho(a) sentiu a vida agradável?"},
                    {7: "O/A seu/sua filho(a) esteve de bom humor?"},
                    {8: "O/A seu/sua filho(a) divertiu-se?"},
                    {9: "O/A seu/sua filho(a) sentiu-se triste?"},
                    {10: "O/A seu/sua filho(a) sentiu-se tão mal que não quis fazer nada?"},
                    {11: "O/A seu/sua filho(a) sentiu-se sozinho(a)?"},
                    {12: "O/A seu/sua filho(a) sentiu-se feliz com a sua própria forma de ser?"},
                ],
                answerTypes: CategoryIntensityList,
            }
        ],
    },
    {
        section: "Autonomia e Relação com os Pais",
        data: [
            {
                context: "Pense na última semana...",
                questions : [
                    {13: "O/A seu/sua filho(a) teve tempo suficiente para si próprio(a)?"},
                    {14: "O/A seu/sua filho(a) tem sido capaz de fazer actividades que quer fazer no tempo livre?"},
                    {15: "O/A seu/sua filho(a) sentiu que os pais tiveram tempo suficiente para ele(a)?"},
                    {16: "O/A seu/sua filho(a) sentiu que os pais o/a trataram com justiça?"},
                    {17: "O/A seu/sua filho(a) foi capaz de falar com os pais quando quis?"},
                    {18: "O/A seu/sua filho(a) teve dinheiro suficiente para fazer as mesmas actividades que os amigos?"},
                    {19: "O/A seu/sua filho(a) teve dinheiro suficiente para as suas próprias despesas?"},
                ],
                answerTypes: CategoryFrequencyList,
            }
        ],
    },
    {
        section: "Suporte Social e Grupo de Pares",
        data: [
            {
                context: "Pense na última semana...",
                questions : [
                    {20: "O/A seu/sua filho(a) passou tempo com os amigos?"},
                    {21: "O/A seu/sua filho(a) divertiu-se com outros rapazes e raparigas?"},
                    {22: "O/A seu/sua filho(a) e os amigos têm-se ajudado uns aos outros?"},
                    {23: "O/A seu/sua filho(a) foi capaz de confiar nos amigos?"},
                ],
                answerTypes: CategoryFrequencyList,
            }
        ],
    },
    {
        section: "Ambiente Escolar",
        data: [
            {
                context: "Pense na última semana...",
                questions : [
                    {24: "O/A seu/sua filho(a) sentiu-se feliz na escola?"},
                    {25: "O/A seu/sua filho(a) foi bom/boa aluno(a) na escola?"},
                    {26: "O/A seu/sua filho(a) sentiu-se capaz de prestar atenção?"},
                    {27: "O/A seu/sua filho(a) teve uma boa relação com os professores?"},
                ],
                answerTypes: CategoryIntensityList,
            }
        ],
    },
];


export type AnswerCategoryList = typeof CategoryIntensityList | typeof CategoryFrequencyList | typeof CategoryQualityList;

export type QuestionnaireSurvey = {
    section: string;
    data: {
        context: string;
        questions: { [key: number]: string }[];
        answerTypes: AnswerCategoryList;
    }[];
}[];


export type QuestionnaireSurveyAnswers = {
    section: string;
    data: {
        context: string;
        data: { [key: number]: {
            question: string;
            answer: string;
        } }[];
        answerTypes: AnswerCategoryList;
    }[];
}[];
