export function encodeTextForTTS(text: string): string {
  return encodeURIComponent(text);
}

export function calculatePropertyMetrics(price: number, arv: number, repairs: number): {
  profit: number;
  roi: number;
  mov: number;
} {
  const totalInvestment = price + repairs;
  const profit = arv - totalInvestment;
  const roi = (profit / totalInvestment) * 100;
  const mov = arv * 0.03; // 3% of ARV as Market Operating Value

  return {
    profit,
    roi,
    mov
  };
}

export async function speakText(text: string, model: string = 'Justin'): Promise<{ audio: HTMLAudioElement, promise: Promise<void> }> {
  const encodedText = encodeTextForTTS(text);
  const encodedModel = encodeURIComponent(model);
  const ttsUrl = `https://icrisstudio1.pythonanywhere.com/api/tts?text=${encodedText}&model=${encodedModel}`;
  
  const audio = new Audio(ttsUrl);
  
  const promise = new Promise<void>((resolve, reject) => {
    audio.onended = () => resolve();
    audio.onerror = reject;
    audio.play().catch(reject);
  });
  
  return { audio, promise };
}
