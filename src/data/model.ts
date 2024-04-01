type Sentence = {
  englishDetail: string
  translateDetail: string
  startTime: number
  endTime: number
}

type Content = {
  listenQuestion: string
  subjectData: {
    listenDetailList: Sentence[]
  }
  audioUrl: string
  seconds: number
  difficulty: number
}

export type Data = {
  content: Content[]
}
