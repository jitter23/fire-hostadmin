/*
 * DO NOT EDIT.  THIS FILE IS GENERATED FROM hostadmin.idl
 */

#ifndef __gen_hostadmin_h__
#define __gen_hostadmin_h__


#ifndef __gen_nsISupports_h__
#include "nsISupports.h"
#endif

/* For IDL files that don't want to include root IDL files. */
#ifndef NS_NO_VTABLE
#define NS_NO_VTABLE
#endif

/* starting interface:    IhostAdmin */
#define IHOSTADMIN_IID_STR "c9379fdf-31ee-4d57-802e-d412842928c9"

#define IHOSTADMIN_IID \
  {0xc9379fdf, 0x31ee, 0x4d57, \
    { 0x80, 0x2e, 0xd4, 0x12, 0x84, 0x29, 0x28, 0xc9 }}

class NS_NO_VTABLE NS_SCRIPTABLE IhostAdmin : public nsISupports {
 public: 

  NS_DECLARE_STATIC_IID_ACCESSOR(IHOSTADMIN_IID)

  /* AString getHostPath (); */
  NS_SCRIPTABLE NS_IMETHOD GetHostPath(nsAString & _retval NS_OUTPARAM) = 0;

};

  NS_DEFINE_STATIC_IID_ACCESSOR(IhostAdmin, IHOSTADMIN_IID)

/* Use this macro when declaring classes that implement this interface. */
#define NS_DECL_IHOSTADMIN \
  NS_SCRIPTABLE NS_IMETHOD GetHostPath(nsAString & _retval NS_OUTPARAM); 

/* Use this macro to declare functions that forward the behavior of this interface to another object. */
#define NS_FORWARD_IHOSTADMIN(_to) \
  NS_SCRIPTABLE NS_IMETHOD GetHostPath(nsAString & _retval NS_OUTPARAM) { return _to GetHostPath(_retval); } 

/* Use this macro to declare functions that forward the behavior of this interface to another object in a safe way. */
#define NS_FORWARD_SAFE_IHOSTADMIN(_to) \
  NS_SCRIPTABLE NS_IMETHOD GetHostPath(nsAString & _retval NS_OUTPARAM) { return !_to ? NS_ERROR_NULL_POINTER : _to->GetHostPath(_retval); } 

#if 0
/* Use the code below as a template for the implementation class for this interface. */

/* Header file */
class _MYCLASS_ : public IhostAdmin
{
public:
  NS_DECL_ISUPPORTS
  NS_DECL_IHOSTADMIN

  _MYCLASS_();

private:
  ~_MYCLASS_();

protected:
  /* additional members */
};

/* Implementation file */
NS_IMPL_ISUPPORTS1(_MYCLASS_, IhostAdmin)

_MYCLASS_::_MYCLASS_()
{
  /* member initializers and constructor code */
}

_MYCLASS_::~_MYCLASS_()
{
  /* destructor code */
}

/* AString getHostPath (); */
NS_IMETHODIMP _MYCLASS_::GetHostPath(nsAString & _retval NS_OUTPARAM)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* End of implementation class template. */
#endif


#endif /* __gen_hostadmin_h__ */
