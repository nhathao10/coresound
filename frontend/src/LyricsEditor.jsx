import { useState, useEffect } from 'react';
import { FaSave, FaTrash, FaPlus, FaMinus, FaMusic, FaUpload } from 'react-icons/fa';

const LyricsEditor = ({ song, onSave, onClose }) => {
  const [lyrics, setLyrics] = useState({
    text: '',
    language: 'vi',
    hasTimestamps: false,
    timestamps: [],
    isOfficial: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    if (song?.lyrics) {
      setLyrics({
        text: song.lyrics.text || '',
        language: song.lyrics.language || 'vi',
        hasTimestamps: song.lyrics.hasTimestamps || false,
        timestamps: song.lyrics.timestamps || [],
        isOfficial: song.lyrics.isOfficial || false
      });
    }
  }, [song]);

  const handleSave = async () => {
    if (!song?._id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:5000/api/songs/${song._id}/lyrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lyrics)
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(true);
        if (onSave) onSave(data.lyrics);
        setTimeout(() => {
          setSuccess(false);
          if (onClose) onClose();
        }, 1500);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Lỗi khi lưu lyrics');
      }
    } catch (err) {
      setError('Lỗi kết nối');
      console.error('Error saving lyrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!song?._id || !confirm('Bạn có chắc muốn xóa lyrics này?')) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:5000/api/songs/${song._id}/lyrics`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSuccess(true);
        setLyrics({
          text: '',
          language: 'vi',
          hasTimestamps: false,
          timestamps: [],
          isOfficial: false
        });
        if (onSave) onSave(null);
        setTimeout(() => {
          setSuccess(false);
          if (onClose) onClose();
        }, 1500);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Lỗi khi xóa lyrics');
      }
    } catch (err) {
      setError('Lỗi kết nối');
      console.error('Error deleting lyrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const addTimestamp = () => {
    setLyrics(prev => ({
      ...prev,
      timestamps: [...prev.timestamps, { time: 0, text: '' }]
    }));
  };

  const removeTimestamp = (index) => {
    setLyrics(prev => ({
      ...prev,
      timestamps: prev.timestamps.filter((_, i) => i !== index)
    }));
  };

  const updateTimestamp = (index, field, value) => {
    setLyrics(prev => ({
      ...prev,
      timestamps: prev.timestamps.map((ts, i) => 
        i === index ? { ...ts, [field]: value } : ts
      )
    }));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Parse .lrc file content
  const parseLrcFile = (content) => {
    const lines = content.split('\n');
    const timestamps = [];
    let fullText = '';

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Match timestamp format [mm:ss.xxx] or [mm:ss.xx] or [mm:ss]
      const timestampMatch = trimmedLine.match(/^\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/);
      
      if (timestampMatch) {
        const minutes = parseInt(timestampMatch[1]);
        const seconds = parseInt(timestampMatch[2]);
        const milliseconds = timestampMatch[3] ? parseInt(timestampMatch[3]) : 0;
        
        // Convert milliseconds to seconds (handle both 2 and 3 digit formats)
        const timeInSeconds = minutes * 60 + seconds + (milliseconds / (milliseconds >= 100 ? 1000 : 100));
        const text = trimmedLine.replace(/^\[\d{2}:\d{2}(?:\.\d{2,3})?\]/, '').trim();
        
        if (text) {
          timestamps.push({
            time: timeInSeconds,
            text: text
          });
          fullText += text + '\n';
        }
      } else if (trimmedLine && !trimmedLine.startsWith('[')) {
        // Line without timestamp
        fullText += trimmedLine + '\n';
      }
    }

    return {
      timestamps: timestamps.sort((a, b) => a.time - b.time),
      fullText: fullText.trim()
    };
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.lrc')) {
      setError('Vui lòng chọn file .lrc');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const parsed = parseLrcFile(content);
        
        if (parsed.timestamps.length > 0) {
          setLyrics(prev => ({
            ...prev,
            text: parsed.fullText,
            hasTimestamps: true,
            timestamps: parsed.timestamps,
            isOfficial: true
          }));
          setShowUploadModal(false);
          setError(null);
        } else {
          setError('Không tìm thấy timestamps trong file .lrc');
        }
      } catch (err) {
        setError('Lỗi khi đọc file .lrc: ' + err.message);
      }
    };
    
    reader.readAsText(file, 'utf-8');
  };

  if (!song) return null;

  return (
    <div className="lyrics-editor">
      <div className="lyrics-editor-header">
        <div className="lyrics-editor-title">
          <FaMusic />
          <h3>Chỉnh sửa Lyrics - {song.title}</h3>
        </div>
        <div className="lyrics-editor-actions">
          <button
            className="lyrics-upload-btn"
            onClick={() => setShowUploadModal(true)}
            title="Upload file .lrc"
          >
            <FaUpload /> Upload .lrc
          </button>
          <button className="lyrics-editor-close" onClick={onClose}>
            ×
          </button>
        </div>
      </div>

      <div className="lyrics-editor-content">
        {error && (
          <div className="lyrics-editor-error">
            {error}
          </div>
        )}

        {success && (
          <div className="lyrics-editor-success">
            Lyrics đã được lưu thành công!
          </div>
        )}

        <div className="lyrics-editor-section">
          <label>
            <input
              type="checkbox"
              checked={lyrics.hasTimestamps}
              onChange={(e) => setLyrics(prev => ({ ...prev, hasTimestamps: e.target.checked }))}
            />
            Sử dụng timestamps (hiển thị theo thời gian)
          </label>
        </div>

        <div className="lyrics-editor-section">
          <label>
            Ngôn ngữ:
            <select
              value={lyrics.language}
              onChange={(e) => setLyrics(prev => ({ ...prev, language: e.target.value }))}
            >
              <option value="vi">Tiếng Việt</option>
              <option value="en">Tiếng Anh</option>
              <option value="ko">Tiếng Hàn</option>
              <option value="ja">Tiếng Nhật</option>
              <option value="zh">Tiếng Trung</option>
            </select>
          </label>
        </div>

        <div className="lyrics-editor-section">
          <label>
            <input
              type="checkbox"
              checked={lyrics.isOfficial}
              onChange={(e) => setLyrics(prev => ({ ...prev, isOfficial: e.target.checked }))}
            />
            Lyrics chính thức
          </label>
        </div>

        {lyrics.hasTimestamps ? (
          <div className="lyrics-editor-section">
            <div className="lyrics-timestamps-header">
              <h4>Timestamps</h4>
              <button onClick={addTimestamp} className="add-timestamp-btn">
                <FaPlus /> Thêm dòng
              </button>
            </div>
            
            <div className="lyrics-timestamps-list">
              {lyrics.timestamps.map((timestamp, index) => (
                <div key={index} className="lyrics-timestamp-item">
                  <div className="timestamp-time">
                    <label>Thời gian (giây):</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={timestamp.time}
                      onChange={(e) => updateTimestamp(index, 'time', parseFloat(e.target.value) || 0)}
                    />
                    <span className="time-display">{formatTime(timestamp.time)}</span>
                  </div>
                  <div className="timestamp-text">
                    <label>Lời:</label>
                    <textarea
                      value={timestamp.text}
                      onChange={(e) => updateTimestamp(index, 'text', e.target.value)}
                      placeholder="Nhập lời bài hát..."
                      rows="2"
                    />
                  </div>
                  <button
                    onClick={() => removeTimestamp(index)}
                    className="remove-timestamp-btn"
                    title="Xóa dòng này"
                  >
                    <FaMinus />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="lyrics-editor-section">
            <label>
              Lyrics (văn bản):
              <textarea
                value={lyrics.text}
                onChange={(e) => setLyrics(prev => ({ ...prev, text: e.target.value }))}
                placeholder="Nhập lyrics của bài hát..."
                rows="10"
              />
            </label>
          </div>
        )}
      </div>

      <div className="lyrics-editor-footer">
        <button
          onClick={handleDelete}
          className="lyrics-delete-btn"
          disabled={loading || (!lyrics.text && lyrics.timestamps.length === 0)}
        >
          <FaTrash /> Xóa Lyrics
        </button>
        <div className="lyrics-editor-actions">
          <button onClick={onClose} className="lyrics-cancel-btn">
            Hủy
          </button>
          <button
            onClick={handleSave}
            className="lyrics-save-btn"
            disabled={loading || (!lyrics.text && lyrics.timestamps.length === 0)}
          >
            {loading ? 'Đang lưu...' : (
              <>
                <FaSave /> Lưu Lyrics
              </>
            )}
          </button>
        </div>
      </div>

      {/* Upload .lrc Modal */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="upload-modal">
            <div className="upload-modal-header">
              <h3>Upload file .lrc</h3>
              <button 
                className="upload-modal-close"
                onClick={() => setShowUploadModal(false)}
              >
                ×
              </button>
            </div>
            <div className="upload-modal-content">
              <p>Chọn file .lrc để import lyrics với timestamps:</p>
              <div className="upload-area">
                <input
                  type="file"
                  accept=".lrc"
                  onChange={handleFileUpload}
                  id="lrc-upload"
                  style={{ display: 'none' }}
                />
                <label htmlFor="lrc-upload" className="upload-label">
                  <FaUpload />
                  <span>Chọn file .lrc</span>
                </label>
              </div>
              <div className="upload-info">
                <p><strong>Định dạng hỗ trợ:</strong></p>
                <ul>
                  <li>File .lrc với timestamps [mm:ss.xxx] hoặc [mm:ss.xx]</li>
                  <li>Encoding: UTF-8</li>
                  <li>Ví dụ: [00:12.345]Lời bài hát hoặc [00:12.34]Lời bài hát</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LyricsEditor;
