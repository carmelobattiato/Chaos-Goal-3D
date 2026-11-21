// WebRTC Voice Chat Manager with Web Audio speaking level detection
export class VoiceChatManager {
  private localStream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private sendSignalCallback: ((targetId: string, signal: unknown) => void) | null = null;
  private onSpeakingCallback: ((isTalking: boolean) => void) | null = null;
  private isMuted: boolean = true;
  private isEnabled: boolean = false;
  private animFrameId: number = 0;
  private selfPlayerId: string = '';

  constructor() {}

  public init(
    selfPlayerId: string,
    sendSignal: (targetId: string, signal: unknown) => void,
    onSpeaking: (isTalking: boolean) => void
  ) {
    this.selfPlayerId = selfPlayerId;
    this.sendSignalCallback = sendSignal;
    this.onSpeakingCallback = onSpeaking;
  }

  public async enableVoice(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return { success: false, error: 'Microfono non supportato in questo browser.' };
      }

      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      this.isEnabled = true;
      this.isMuted = false;

      // Setup audio analyzer for speaking wave detection
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtx();
      const source = this.audioCtx.createMediaStreamSource(this.localStream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      this.startSpeakingDetection();

      return { success: true };
    } catch (err) {
      console.warn('Voice chat permission error:', err);
      return { success: false, error: 'Permesso microfono negato o dispositivo occupato.' };
    }
  }

  public toggleMute(): boolean {
    if (!this.localStream) return true;
    this.isMuted = !this.isMuted;
    this.localStream.getAudioTracks().forEach((track) => {
      track.enabled = !this.isMuted;
    });
    if (this.isMuted && this.onSpeakingCallback) {
      this.onSpeakingCallback(false);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  private startSpeakingDetection() {
    if (!this.analyser) return;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    let wasTalking = false;

    const checkVolume = () => {
      if (!this.analyser || this.isMuted) {
        if (wasTalking) {
          wasTalking = false;
          if (this.onSpeakingCallback) this.onSpeakingCallback(false);
        }
        this.animFrameId = requestAnimationFrame(checkVolume);
        return;
      }

      this.analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      const isTalking = average > 18; // Speaking threshold

      if (isTalking !== wasTalking) {
        wasTalking = isTalking;
        if (this.onSpeakingCallback) {
          this.onSpeakingCallback(isTalking);
        }
      }

      this.animFrameId = requestAnimationFrame(checkVolume);
    };

    this.animFrameId = requestAnimationFrame(checkVolume);
  }

  public async connectToPeer(remotePlayerId: string, isInitiator: boolean) {
    if (!this.localStream || this.peerConnections.has(remotePlayerId)) return;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    this.peerConnections.set(remotePlayerId, pc);

    this.localStream.getTracks().forEach((track) => {
      pc.addTrack(track, this.localStream!);
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && this.sendSignalCallback) {
        this.sendSignalCallback(remotePlayerId, { candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      const remoteAudio = new Audio();
      remoteAudio.srcObject = event.streams[0];
      remoteAudio.autoplay = true;
      remoteAudio.play().catch((e) => console.warn('Autoplay prevented:', e));
    };

    if (isInitiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      if (this.sendSignalCallback) {
        this.sendSignalCallback(remotePlayerId, { sdp: pc.localDescription });
      }
    }
  }

  public async handleSignal(remotePlayerId: string, signal: { sdp?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit }) {
    let pc = this.peerConnections.get(remotePlayerId);
    if (!pc) {
      await this.connectToPeer(remotePlayerId, false);
      pc = this.peerConnections.get(remotePlayerId);
    }
    if (!pc) return;

    if (signal.sdp) {
      await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
      if (signal.sdp.type === 'offer') {
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        if (this.sendSignalCallback) {
          this.sendSignalCallback(remotePlayerId, { sdp: pc.localDescription });
        }
      }
    } else if (signal.candidate) {
      await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
    }
  }

  public removePeer(remotePlayerId: string) {
    const pc = this.peerConnections.get(remotePlayerId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(remotePlayerId);
    }
  }

  public dispose() {
    cancelAnimationFrame(this.animFrameId);
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
    this.isEnabled = false;
  }
}

export const voiceChat = new VoiceChatManager();
