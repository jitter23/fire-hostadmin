#include "hostadmin.h"
#include "nsStringAPI.h"
#include "nsIGenericFactory.h"

#include "windows.h"

class ChostAdmin : public IhostAdmin
{
public:
  NS_DECL_ISUPPORTS
  NS_DECL_IHOSTADMIN

  ChostAdmin();

private:
  ~ChostAdmin();

protected:
  /* additional members */
};


NS_IMPL_ISUPPORTS1(ChostAdmin, IhostAdmin)

ChostAdmin::ChostAdmin()
{
  /* member initializers and constructor code */
}

ChostAdmin::~ChostAdmin()
{
  /* destructor code */
}

/* AString getHostPath (); */
NS_IMETHODIMP ChostAdmin::GetHostPath(nsAString & _retval NS_OUTPARAM)
{
    wchar_t buf[MAX_PATH];
    GetSystemDirectory(buf,MAX_PATH + 1);
	_retval.Assign(buf);
	_retval += L"\\drivers\\etc\\hosts";
	return NS_OK;
}



NS_GENERIC_FACTORY_CONSTRUCTOR(ChostAdmin)

static nsModuleComponentInfo components[] =
{
    {
       "HostAdmin", 
       IHOSTADMIN_IID,
       "@phpsix.net/hostadmin;1",
       ChostAdminConstructor,
    }
};

NS_IMPL_NSGETMODULE("HostAdmin", components) 