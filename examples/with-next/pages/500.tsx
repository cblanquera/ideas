//hooks
import { useRouter } from 'next/router';
import { useLanguage } from 'r22n';
//components
import HTMLHead from 'next/head';
import Button from 'frui-tailwind/Button';
import { LayoutBlank } from 'adent/theme';

export const Head = () => {
  const { _ } = useLanguage();
  return (
    <HTMLHead>
      <title>{_('Application Error')}</title>
    </HTMLHead>
  );
};

export default function Page() {
  //hooks
  const router = useRouter();
  const { _ } = useLanguage();
  return (
    <LayoutBlank head={Head}>
      <main className="max-w-lg m-auto flex flex-col h-full relative justify-center items-center">
        <div className="p-8 bg-b2 w-full overflow-auto text-center mb-4">
          <h1 className="text-2xl mb-4">
            {_('Application Error')}
          </h1>
          <p>
            {_('Sorry this page created an error.')}
          </p>
          <Button info className="mt-4" onClick={() => router.back()}>
            {_('Go Back')}
          </Button>
        </div>
      </main>
    </LayoutBlank>
  );
}