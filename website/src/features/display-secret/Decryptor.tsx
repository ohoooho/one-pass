import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { useParams } from 'react-router-dom';
import { useAsync } from 'react-use';
import { decryptMessage } from '@shared/lib/crypto';
import { downloadBlob } from '@shared/lib/download';
import { useCopy } from '@shared/hooks/useCopy';
import DecryptingSpinner from '@shared/components/DecryptingSpinner';
import {
  CopyIcon,
  DownloadIcon,
  QrCodeIcon,
  UnlockIcon,
} from '@shared/components/icons';
import EnterDecryptionKey from './EnterDecryptionKey';
import FileDownloadedCard from './FileDownloadedCard';

const maxQRCodeLength = 500;

export default function Decryptor({ secret }: { secret: string }) {
  const { t } = useTranslation();
  const { format, password: paramsPassword } = useParams();
  const [password, setPassword] = useState(() => paramsPassword ?? '');
  const [showQR, setShowQR] = useState(false);
  const { copy, isCopied } = useCopy();

  const { loading, error, value } = useAsync(async () => {
    if (!password) {
      return;
    }
    const message = await decryptMessage(
      secret,
      password,
      format === 'f' ? 'binary' : 'utf8',
    );

    if (format === 'f') {
      return {
        data: message.data as Uint8Array,
        filename: (message as { filename?: string }).filename || 'download',
        isFile: true,
      };
    }

    return {
      data: message.data as string,
      isFile: false,
    };
  }, [password, secret, format]);

  const tooLongForQRCode = value && value?.data?.length > maxQRCodeLength;

  useEffect(() => {
    if (value && value.isFile) {
      downloadBlob(
        new Uint8Array(value.data as Uint8Array),
        value.filename || 'download',
      );
    }
  }, [value]);

  function handleCopy() {
    if (!value || value.isFile) return;
    copy(value.data as string);
  }

  if (loading) {
    return <DecryptingSpinner />;
  }

  if (error || !value) {
    return (
      <EnterDecryptionKey
        setPassword={setPassword}
        errorMessage={Boolean(error)}
      />
    );
  }

  if (value && value.isFile) {
    return (
      <>
        <FileDownloadedCard filename={value.filename || 'download'} />
        <button
          className="btn btn-primary flex items-center gap-2 min-w-[200px] rounded-2xl"
          onClick={() =>
            downloadBlob(
              new Uint8Array(value.data as Uint8Array),
              value.filename || 'download',
            )
          }
          aria-label={t('secret.buttonDownloadFile')}
        >
          <DownloadIcon className="h-6 w-6" />
          {t('secret.buttonDownloadFile')}
        </button>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center mb-2">
        <UnlockIcon className="h-8 w-8 text-success mr-2" />
        <h2 className="text-3xl font-bold text-[#3A2E5C]">{t('secret.titleMessage')}</h2>
      </div>
      <p className="mb-6 text-[#3A2E5C]/70">{t('secret.subtitleMessage')}</p>
      <div
        className="mb-8 rounded-2xl p-6 text-base font-mono whitespace-pre-wrap min-h-[120px] text-[#3A2E5C] break-words"
        style={{
          background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFAFA 100%)',
          border: '1.5px solid #B8E6C1',
        }}
      >
        {value.data as string}
      </div>
      <div className="flex flex-wrap gap-4 justify-center mb-6">
        <button
          className="btn btn-primary flex items-center gap-3 px-8 font-medium shadow-sm hover:shadow transition-all duration-200 rounded-2xl"
          onClick={handleCopy}
          aria-label={t('secret.buttonCopyToClipboard')}
        >
          <CopyIcon className="h-5 w-5" />
          {isCopied()
            ? t('secret.buttonCopied')
            : t('secret.buttonCopyToClipboard')}
        </button>

        {!tooLongForQRCode && (
          <button
            className="btn btn-outline btn-primary flex items-center gap-3 px-8 font-medium shadow-sm hover:shadow transition-all duration-200 rounded-2xl"
            onClick={() => setShowQR(v => !v)}
            type="button"
            aria-label={
              showQR && !tooLongForQRCode
                ? t('secret.hideQrCode')
                : t('secret.showQrCode')
            }
          >
            <QrCodeIcon className="h-5 w-5" />
            {showQR && !tooLongForQRCode
              ? t('secret.hideQrCode')
              : t('secret.showQrCode')}
          </button>
        )}
      </div>
      {showQR && !tooLongForQRCode && (
        <div className="mt-8 flex justify-center">
          <div
            className="bg-white rounded-2xl p-6 shadow-sm"
            style={{ border: '1.5px solid #E0E6F0' }}
          >
            <QRCodeSVG
              size={250}
              style={{ height: 'auto' }}
              value={value.data as string}
            />
          </div>
        </div>
      )}
    </>
  );
}
