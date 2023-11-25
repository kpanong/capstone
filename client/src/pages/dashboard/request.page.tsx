import { SubmitHandler, useForm } from 'react-hook-form';
import RequestFormFields from '../../components/form-request.component';
import { IContributionRequest } from '../../interfaces/client.interface';
import { Button, Flex, message } from 'antd';
import HttpClient from '../../utils/http-client.util';
import { API } from '../../const/api.const';

function RequestPage() {
  const {
    handleSubmit: handleSubmitRequestFormData,
    control: requestController,
    formState: { isSubmitting: isCreatingRequest, errors },
  } = useForm<IContributionRequest>();
  const [messageApi, contextHolder] = message.useMessage();

  const handleCreateRequest: SubmitHandler<IContributionRequest> = async (
    data
  ) => {
    data.status = 'PENDING';
    await HttpClient.post<IContributionRequest, any>(
      `${API.contributionRequests}`,
      data
    );

    return toastSuccess('Submitted successfully!');
  };

  const toastSuccess = (message: string) => {
    messageApi.success({
      type: 'success',
      content: message,
      style: {
        marginTop: '90vh',
      },
    });
  };

  return (
    <>
      {contextHolder}
      <div style={{ background: '#fbfbff' }}>
        <Flex
          justify="center"
          style={{
            background: 'white',
            borderRadius: 20,
            width: '100%',
            marginTop: 100,
          }}
        >
          <div style={{ width: '40%' }}>
            <form onSubmit={handleSubmitRequestFormData(handleCreateRequest)}>
              <RequestFormFields control={requestController} errors={errors} />
              <Button
                type="primary"
                size="middle"
                loading={isCreatingRequest}
                style={{ marginTop: 20 }}
                htmlType="submit"
                shape="round"
                block
              >
                Submit
              </Button>
            </form>
          </div>
        </Flex>
      </div>
    </>
  );
}

export default RequestPage;