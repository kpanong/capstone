import { useEffect, useState } from 'react';
import {
  Button,
  Divider,
  Flex,
  Modal,
  Table,
  Timeline,
  Tooltip,
  message,
} from 'antd';
import { useNavigate } from 'react-router-dom';

// Custom Imports
import NavigationBarAdmin from '../../../components/nav-admin.component';
import { SubmitHandler, useForm } from 'react-hook-form';
import { isEmpty } from '../../../utils/util';
import { API, API_BASE_URL } from '../../../const/api.const';
import HttpClient from '../../../utils/http-client.util';
import { IApiResponse } from '../../../interfaces/api.interface';
import useLocalStorage from '../../../hooks/useLocalstorage.hook';
import {
  IContribution,
  IEmployeeProfile,
  ISearchPayload,
  IUser,
  IWorkHistory,
} from '../../../interfaces/client.interface';
import {
  formatStandardDate,
  formatStandardDateTime,
} from '../../../utils/date.util';
import { contributionColumns, employeeColumns, employeeContributionColumns } from '../../../const/table-columns.const';
import {
  EditOutlined,
  EyeOutlined,
  ManOutlined,
  WomanOutlined,
} from '@ant-design/icons';
import SearchFormFields from '../../../components/form-search-employee.component';
import axios from 'axios';

interface IState {
  isFetchingStaffs: boolean;
  isFetchingEmployees: boolean;
  isAuthModalOpen: boolean;
  isRegistrationModealOpen: boolean;
  isEmployeeRegistrationOpen: boolean;
  isWorkHistoryModalOpen: boolean;
  isPasswordNotMatched: boolean;
  isPasswordMinMaxErr: boolean;
  isUsernameAlreadyExist: boolean;
  stateWorkHistoryPreview?: IWorkHistory;
  employees: IEmployeeProfile[];
  users: IUser[];
}

function AdminEmployeeList() {
  const { value: getAuthResponse } = useLocalStorage<IApiResponse | null>(
    'auth_response',
    null
  );
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();

  const {
    handleSubmit: handleSubmitSearchFormData,
    control: searchController,
    formState: { isSubmitting: isSearchingEmployee },
  } = useForm<ISearchPayload>();

  const [state, setState] = useState<IState>({
    isFetchingStaffs: false,
    isFetchingEmployees: false,
    isAuthModalOpen: false,
    isRegistrationModealOpen: false,
    isWorkHistoryModalOpen: false,
    isPasswordNotMatched: false,
    isUsernameAlreadyExist: false,
    isPasswordMinMaxErr: false,
    isEmployeeRegistrationOpen: false,
    stateWorkHistoryPreview: {
      client_id: 999,
      company_name: '',
      created_at: '',
      end_date: '',
      id: 999,
      position: '',
      responsibilities: '',
      start_date: '',
      updated_at: '',
      duration: '',
    },
    employees: [],
    users: [],
  });

  const handleSearch: SubmitHandler<ISearchPayload> = async (data) => {
    const isInvalidSearchkey =
      /[0-9]/.test(data.searchKeyword!) && /[a-zA-Z]/.test(data.searchKeyword!);

    if (isInvalidSearchkey) {
      return toastError(
        'Search keyword must be a School ID or Department name.'
      );
    }
    // Check if the searchKeyword contains a number
    const isNumeric = /\d/.test(data.searchKeyword!);
    if (isNumeric) {
      // If it contains a number, search by schoolId
      await getAllEmployees({ schoolId: data.searchKeyword?.trim() });
    } else {
      // If it doesn't contain a number, search by department
      await getAllEmployees({ searchKeyword: data.searchKeyword?.trim() });
    }
  };

  const handleOk = () => {
    setState((prev) => ({
      ...prev,
      isAuthModalOpen: false,
    }));

    navigate('/', { replace: true });
  };

  const toastError = (message: string) => {
    messageApi.error({
      type: 'error',
      content: message,
      style: {
        marginTop: '90vh',
      },
    });
  };

  const getEmployeeContribution = async (sssNo: string) => {
    const response: { data: IContribution[] } = await axios.get(
      `${API_BASE_URL}/api/record/v1?sssNo=${sssNo}`,
      {
        headers: {
          Authorization: `Bearer ${getAuthResponse?.access_token}`,
        },
      }
    );

    console.log(response.data)
  }

  const getAllEmployees = async (data?: {
    searchKeyword?: string;
    schoolId?: string;
  }) => {
    setState((prev) => ({
      ...prev,
      isFetchingEmployees: true,
    }));

    let getAllEmployeesResponse: any = null;

    if (!isEmpty(data?.schoolId)) {
      const findBySchoolId = await HttpClient.setAuthToken(
        getAuthResponse?.access_token
      ).get<IEmployeeProfile[], any>(
        `${API.employees}/${data?.schoolId}/information`,
        {}
      );
      if (findBySchoolId.message === 'Employee Not found.') {
        getAllEmployeesResponse = [];
      } else {
        findBySchoolId.data = [findBySchoolId.data as any];
        getAllEmployeesResponse = findBySchoolId;
      }
    } else {
      getAllEmployeesResponse = await HttpClient.setAuthToken(
        getAuthResponse?.access_token
      ).get<IEmployeeProfile[], { role: string }>(API.employees, {
        role: 'EMPLOYEE',
        ...(data?.searchKeyword ? { department: data?.searchKeyword } : {}),
      });
    }
    if (getAllEmployeesResponse.message === 'Authentication required.') {
      setState((prev) => ({
        ...prev,
        isAuthModalOpen: true,
      }));

      return;
    }

    if (!Array.isArray(getAllEmployeesResponse.data)) {
      setState((prev) => ({
        ...prev,
        isFetchingEmployees: false,
      }));
      return toastError(
        'Oops! No employees found for the provided search keyword.'
      );
    }

    setState((prev) => ({
      ...prev,
      isFetchingEmployees: false,
      employees: getAllEmployeesResponse.data?.map((el: IEmployeeProfile) => ({
        ...el,
        middle_name: el.middle_name === 'N/A' ? '' : el.middle_name,
        birthdate: formatStandardDate(el.birthdate),
        created_at: formatStandardDateTime(el.created_at),
        actions: (
          <Flex gap={10}>
            <Tooltip title="Edit">
              <Button
                type="dashed"
                icon={<EditOutlined />}
                onClick={() =>
                  navigate(
                    `/dashboard/a/account-management/employee/${el.school_id}/edit`,
                    {
                      state: el,
                    }
                  )
                }
              >
                Edit
              </Button>
            </Tooltip>
            <Tooltip title="View">
              <Button
                type="primary"
                icon={<EyeOutlined />}
                onClick={() =>
                  navigate(`/dashboard/a/employee/${el.school_id}`, {
                    state: el,
                  })
                }
              >
                {' '}
                View
              </Button>
            </Tooltip>
          </Flex>
        ),
        key: el.id,
      })) as any,
    }));
  };

  useEffect(() => {
    document.title = 'Account Management | SSS Archiving System';
    getAllEmployees();
    return () => { };
  }, []);

  return (
    <>
      {contextHolder}
      <NavigationBarAdmin />

      <div style={{ padding: '50px' }}>
        <SearchFormFields
          onSearch={handleSubmitSearchFormData(handleSearch)}
          control={searchController}
          isSearching={isSearchingEmployee}
        />
        <Table
          columns={employeeColumns}
          dataSource={state.employees as any}
          size="middle"
          loading={state.isFetchingEmployees}
          expandable={{
            expandedRowRender: (record: any) => {
              return (
                <div style={{ 
                    padding: 10, 
                    border: "1px solid #e4e4e4",
                    borderRadius: 20,
                   }}>
                  <Flex justify='center'>
                    <p
                      style={{
                        fontSize: 24,
                        fontWeight: 'bold',
                        color: '#111',
                      }}
                    >
                      Summary of {record.first_name}
                    </p>
                  </Flex>
                  <Flex>
                    <div
                      style={{
                        flex: 1,
                        padding: 50,
                        background: 'white',
                        borderRadius: 20,
                      }}
                    >

                      <p
                        style={{
                          padding: 0,
                          margin: 0,
                          fontSize: 14,
                          color: '#111',
                        }}
                      >
                        Full name
                      </p>
                      <p
                        style={{
                          padding: 0,
                          margin: 0,
                          fontSize: 17,
                          fontWeight: 'normal',
                          color: '#444',
                        }}
                      >
                        {record.last_name}, {record.first_name}{' '}
                        {record.middle_name}
                      </p>

                      <p
                        style={{
                          padding: 0,
                          margin: 0,
                          marginTop: 20,
                          fontSize: 14,
                          color: '#111',
                        }}
                      >
                        Gender
                      </p>
                      <p
                        style={{
                          padding: 0,
                          margin: 0,
                          fontSize: 17,
                          fontWeight: 'normal',
                          color: '#444',
                        }}
                      >
                        {record.gender === 'FEMALE' ? (
                          <WomanOutlined style={{ color: 'pink' }} />
                        ) : (
                          <></>
                        )}
                        {record.gender === 'MALE' ? (
                          <ManOutlined style={{ color: 'blue' }} />
                        ) : (
                          <></>
                        )}{' '}
                        {record.gender}
                      </p>

                      <p
                        style={{
                          padding: 0,
                          margin: 0,
                          marginTop: 20,
                          fontSize: 14,
                          color: '#111',
                        }}
                      >
                        Birthdate
                      </p>
                      <p
                        style={{
                          padding: 0,
                          margin: 0,
                          fontSize: 17,
                          fontWeight: 'normal',
                          color: '#444',
                        }}
                      >
                        {record.birthdate}
                      </p>
                      <Divider />

                      <p
                        style={{
                          padding: 0,
                          margin: 0,
                          marginTop: 100,
                          fontSize: 8,
                          color: '#111',
                        }}
                      >
                        Date Created
                      </p>
                      <p
                        style={{
                          padding: 0,
                          margin: 0,
                          fontSize: 12,
                          fontWeight: 'normal',
                          color: '#444',
                        }}
                      >
                        {record.created_at}
                      </p>
                    </div>
                    <div
                      style={{
                        flex: 5,
                        borderRadius: 20,
                      }}
                    >
                      <Flex justify='end' style={{ marginBottom: 10 }}>
                        <Tooltip title="Print records to PDF">
                          <Button
                            type="dashed"
                            icon={<EditOutlined />}>
                            Generate
                          </Button>
                        </Tooltip>
                      </Flex>
                      <Table
                        columns={employeeContributionColumns}
                        dataSource={record.contributions as any}
                        loading={false}
                        size="small"
                      />
                    </div>
                  </Flex>
                </div>
              );
            },
            rowExpandable: (record) => record.name !== 'Not Expandable',
          }}
        />
      </div>

      <Modal
        title="Oops!"
        closable={false}
        open={state.isAuthModalOpen}
        width={400}
        cancelButtonProps={{
          style: { display: 'none' },
        }}
        onOk={handleOk}
      >
        <p>
          Authentication session has expired. Kindly proceed to log in again for
          continued access.
        </p>
      </Modal>
    </>
  );
}

export default AdminEmployeeList;
